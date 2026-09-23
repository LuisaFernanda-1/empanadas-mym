<?php
declare(strict_types=1);

/**
 * Resuelve QUÉ emprendimiento se está visitando a partir del dominio.
 * Es la pieza que garantiza que los datos de un sitio no aparezcan en otro:
 * todas las consultas de la API usan Tenant::id().
 */
final class Tenant
{
    private static ?array $site = null;
    private static bool $resolved = false;

    public static function normalizeHost(string $host): string
    {
        $host = strtolower(trim($host));
        $host = preg_replace('/:\d+$/', '', $host) ?? $host;   // quita el puerto
        return preg_replace('/^www\./', '', $host) ?? $host;   // www.x.com == x.com
    }

    public static function resolve(): ?array
    {
        if (self::$resolved) {
            return self::$site;
        }
        self::$resolved = true;

        $host = self::normalizeHost((string) ($_SERVER['HTTP_HOST'] ?? ''));
        $site = Database::one(
            'SELECT s.* FROM site_domains d JOIN sites s ON s.id = d.site_id
             WHERE d.domain = ? AND s.is_active = 1 LIMIT 1',
            [$host]
        );

        // Solo en desarrollo: ?sitio=slug, cabecera X-Sitio o sitio por defecto
        if ($site === null && config('dev_mode')) {
            $slug = $_GET['sitio'] ?? $_SERVER['HTTP_X_SITIO'] ?? $_COOKIE['dev_sitio'] ?? config('dev_default_site');
            if (isset($_GET['sitio'])) {
                setcookie('dev_sitio', (string) $_GET['sitio'], ['path' => '/', 'samesite' => 'Lax']);
            }
            $site = Database::one('SELECT * FROM sites WHERE slug = ? AND is_active = 1', [(string) $slug]);
        }

        return self::$site = $site;
    }

    public static function require(): array
    {
        $site = self::resolve();
        if ($site === null) {
            Http::error('Este dominio no tiene un emprendimiento configurado.', 404);
        }
        return $site;
    }

    public static function id(): int
    {
        return (int) self::require()['id'];
    }
}
