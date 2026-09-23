<?php
declare(strict_types=1);

/**
 * Envía correos vía SMTP usando sockets de PHP (sin librerías externas).
 * Soporta STARTTLS (puerto 587) y SSL directo (puerto 465).
 * Configuración en config.php → clave 'mail'.
 */
final class Mailer
{
    /** $replyTo debe venir validado (FILTER_VALIDATE_EMAIL) porque va en una cabecera. */
    public static function send(string $to, string $subject, string $body, ?string $replyTo = null): void
    {
        $cfg = config('mail', []);

        // Sin configuración SMTP → log en dev, silencio en producción
        if (empty($cfg['host'])) {
            self::log($to, $subject, $body);
            return;
        }

        self::smtp($to, $subject, $body, $cfg, $replyTo);
    }

    // ------------------------------------------------------------------ SMTP
    private static function smtp(string $to, string $subject, string $body, array $cfg, ?string $replyTo = null): void
    {
        $host = (string) $cfg['host'];
        $port = (int) ($cfg['port'] ?? 587);
        $user = (string) ($cfg['user'] ?? '');
        $pass = (string) ($cfg['pass'] ?? '');
        $from = (string) ($cfg['from'] ?? $user);
        $fromName = (string) ($cfg['from_name'] ?? '');
        $ssl  = ($port === 465);

        $address = ($ssl ? 'ssl://' : '') . $host;
        $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
        $conn = @stream_socket_client("{$address}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
        if (!$conn) {
            throw new \RuntimeException("SMTP connect failed ({$host}:{$port}): {$errstr}");
        }
        stream_set_timeout($conn, 15);

        $hostname = $_SERVER['SERVER_NAME'] ?? 'localhost';
        self::expect($conn, '220');
        self::cmd($conn, "EHLO {$hostname}");
        $ehlo = self::read($conn);

        if (!$ssl && str_contains($ehlo, 'STARTTLS')) {
            self::cmd($conn, 'STARTTLS');
            self::expect($conn, '220');
            stream_socket_enable_crypto($conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            self::cmd($conn, "EHLO {$hostname}");
            self::read($conn);
        }

        if ($user !== '') {
            self::cmd($conn, 'AUTH LOGIN');
            self::expect($conn, '334');
            self::cmd($conn, base64_encode($user));
            self::expect($conn, '334');
            self::cmd($conn, base64_encode($pass));
            self::expect($conn, '235');
        }

        $fromHeader = $fromName !== '' ? "\"{$fromName}\" <{$from}>" : $from;

        self::cmd($conn, "MAIL FROM:<{$from}>");
        self::expect($conn, '250');
        self::cmd($conn, "RCPT TO:<{$to}>");
        self::expect($conn, '25');
        self::cmd($conn, 'DATA');
        self::expect($conn, '354');

        $msg = self::buildMessage($fromHeader, $to, $subject, $body, $replyTo);
        fwrite($conn, $msg . "\r\n.\r\n");
        self::expect($conn, '250');
        self::cmd($conn, 'QUIT');
        fclose($conn);
    }

    private static function buildMessage(string $from, string $to, string $subject, string $body, ?string $replyTo = null): string
    {
        $date = date('r');
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        return implode("\r\n", [
            "Date: {$date}",
            "From: {$from}",
            "To: {$to}",
            ...($replyTo ? ["Reply-To: {$replyTo}"] : []),
            "Subject: {$encodedSubject}",
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            chunk_split(base64_encode($body)),
        ]);
    }

    private static function cmd($conn, string $cmd): void
    {
        fwrite($conn, $cmd . "\r\n");
    }

    private static function read($conn): string
    {
        $out = '';
        while ($line = fgets($conn, 512)) {
            $out .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $out;
    }

    private static function expect($conn, string $code): void
    {
        $resp = self::read($conn);
        if (!str_starts_with(trim($resp), $code)) {
            throw new \RuntimeException("SMTP unexpected response (expected {$code}): " . trim($resp));
        }
    }

    // ------------------------------------------------------------------ Log
    private static function log(string $to, string $subject, string $body): void
    {
        $logFile = __DIR__ . '/../mail.log';
        $entry = sprintf(
            "[%s]\nTo: %s\nSubject: %s\n%s\n%s\n",
            date('Y-m-d H:i:s'), $to, $subject, $body, str_repeat('-', 60)
        );
        file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    }
}
