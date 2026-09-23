<?php
declare(strict_types=1);

/**
 * Entrada de TODAS las páginas del sitio (/, /productos, /admin...).
 * Sirve la app de Vue ya compilada e inyecta en el HTML los datos del
 * emprendimiento que corresponde al dominio: título, descripción SEO,
 * colores, fuentes y la información inicial (sin esperar a la API).
 */
require __DIR__ . '/core/bootstrap.php';

$template = __DIR__ . '/core/template.html';
if (!is_file($template)) {
    http_response_code(500);
    exit('Falta core/template.html. Ejecuta "npm run build" en /frontend.');
}

try {
    $site = Tenant::resolve();
} catch (Throwable $e) {
    error_log('[SITE] ' . $e->getMessage());
    http_response_code(503);
    exit('El sitio no está disponible en este momento.');
}

if ($site === null) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    exit('<!doctype html><meta charset="utf-8"><title>Sitio no encontrado</title>'
        . '<p style="font-family:sans-serif;padding:40px">Este dominio aún no tiene un emprendimiento configurado.</p>');
}

$data = SiteData::forSite($site);
$s = $data['site'];
$e = fn (?string $v): string => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$base = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? '');
$abs = fn (?string $u): string => $u ? (preg_match('~^https?://~', $u) ? $u : $base . $u) : '';

$title = $s['name'] . ' | ' . $s['heroTitle'];
$desc = $s['metaDescription'] ?: $s['heroText'];
$fonts = array_unique([$s['theme']['fontHeading'], $s['theme']['fontBrand'], 'Inter']);
$fontQuery = implode('&', array_map(fn ($f) => 'family=' . str_replace(' ', '+', $f) . ':wght@400;500;600;700', $fonts));

$head = implode("\n    ", [
    '<title>' . $e($title) . '</title>',
    '<meta name="description" content="' . $e($desc) . '">',
    '<meta name="theme-color" content="' . $e($s['theme']['primary']) . '">',
    '<link rel="icon" href="' . $e($s['logo']) . '">',
    '<link rel="canonical" href="' . $e($base . strtok($_SERVER['REQUEST_URI'] ?? '/', '?')) . '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' . $e($title) . '">',
    '<meta property="og:description" content="' . $e($desc) . '">',
    '<meta property="og:image" content="' . $e($abs($s['heroImage'])) . '">',
    '<meta property="og:locale" content="es_CO">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?' . $e($fontQuery) . '&display=swap">',
    // Colores aplicados antes de que cargue Vue (evita parpadeo)
    '<style>:root{--c-primary:' . $e($s['theme']['primary']) . ';--c-secondary:' . $e($s['theme']['secondary'])
        . ';--c-accent:' . $e($s['theme']['accent']) . ';--f-heading:"' . $e($s['theme']['fontHeading'])
        . '";--f-brand:"' . $e($s['theme']['fontBrand']) . '"}</style>',
]);

$json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$script = '<script>window.__SITE__=' . $json . ';</script>';

$html = (string) file_get_contents($template);
$html = preg_replace('~<title>.*?</title>~s', '', $html, 1) ?? $html;  // quita el <title> genérico de Vite
$html = str_replace(['<!--SITE_HEAD-->', '<!--SITE_DATA-->'], [$head, $script], $html);

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
echo $html;
