<?php
declare(strict_types=1);

/** Utilidades HTTP: respuestas JSON, errores y lectura del cuerpo. */
final class Http
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, array $extra = []): never
    {
        self::json(['error' => $message] + $extra, $status);
    }

    /** Cuerpo JSON (login) o campos de formulario (productos con imagen). */
    public static function input(): array
    {
        $type = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($type, 'application/json')) {
            $data = json_decode(file_get_contents('php://input') ?: '[]', true);
            return is_array($data) ? $data : [];
        }
        return $_POST;
    }

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function clientIp(): string
    {
        return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
    }
}
