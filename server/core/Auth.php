<?php
declare(strict_types=1);

/**
 * Sesión del panel. Cada administrador pertenece a UN sitio y la sesión
 * solo es válida en ese sitio (se compara con el dominio visitado).
 */
final class Auth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        session_name((string) config('session_name', 'emp_admin'));
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $https,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();

        // Expira por inactividad
        $ttl = (int) config('session_lifetime', 28800);
        if (isset($_SESSION['last_seen']) && time() - $_SESSION['last_seen'] > $ttl) {
            self::logout();
            session_start();
        }
        $_SESSION['last_seen'] = time();
    }

    public static function attempt(string $login, string $password): array
    {
        $siteId = Tenant::id();
        $ip = Http::clientIp();
        $window = (int) config('login_window_minutes', 15);

        // Los intentos viejos ya no cuentan: se borran para que la tabla no crezca
        Database::run('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)');

        $recent = Database::one(
            'SELECT COUNT(*) AS n FROM login_attempts
             WHERE site_id = ? AND ip = ? AND attempted_at > (NOW() - INTERVAL ' . $window . ' MINUTE)',
            [$siteId, $ip]
        );
        if ((int) $recent['n'] >= (int) config('login_max_attempts', 5)) {
            Http::error("Demasiados intentos. Espera {$window} minutos e inténtalo de nuevo.", 429);
        }

        $admin = Database::one(
            'SELECT * FROM admins WHERE site_id = ? AND (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) LIMIT 1',
            [$siteId, $login, $login]
        );

        if ($admin === null || !password_verify($password, $admin['password_hash'])) {
            Database::run('INSERT INTO login_attempts (site_id, ip, attempted_at) VALUES (?, ?, NOW())', [$siteId, $ip]);
            Http::error('Usuario o contraseña incorrectos.', 401);
        }

        Database::run('DELETE FROM login_attempts WHERE site_id = ? AND ip = ?', [$siteId, $ip]);
        Database::run('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [$admin['id']]);

        if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
            Database::run('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $admin['id']]);
        }

        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['site_id'] = $siteId;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));

        return self::publicUser($admin);
    }

    public static function user(): ?array
    {
        self::start();
        if (empty($_SESSION['admin_id']) || (int) ($_SESSION['site_id'] ?? 0) !== Tenant::id()) {
            return null;
        }
        $admin = Database::one('SELECT * FROM admins WHERE id = ? AND site_id = ?', [$_SESSION['admin_id'], Tenant::id()]);
        return $admin ? self::publicUser($admin) : null;
    }

    /** Exige sesión válida y, en peticiones que modifican datos, el token CSRF. */
    public static function requireAdmin(): array
    {
        $user = self::user();
        if ($user === null) {
            Http::error('Debes iniciar sesión.', 401);
        }
        if (Http::method() !== 'GET') {
            $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
            if (!is_string($token) || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $token)) {
                Http::error('La sesión expiró. Recarga la página.', 419);
            }
        }
        return $user;
    }

    public static function logout(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        $_SESSION = [];
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'],
            'httponly' => $p['httponly'], 'samesite' => $p['samesite'] ?: 'Lax',
        ]);
        session_destroy();
    }

    private static function publicUser(array $admin): array
    {
        return [
            'username' => $admin['username'],
            'email'    => $admin['email'],
            'csrf'     => $_SESSION['csrf'] ?? null,
        ];
    }
}
