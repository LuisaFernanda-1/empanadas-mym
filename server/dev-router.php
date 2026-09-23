<?php
// SOLO DESARROLLO: imita el .htaccess con el servidor embebido de PHP.
//   php -S localhost:8080 dev-router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('~^/(core|tools)(/|$)~', $path)) { http_response_code(403); exit('Prohibido'); }
if (preg_match('~^/api(/|$)~', $path)) { require __DIR__ . '/api/index.php'; return true; }
if ($path !== '/' && is_file(__DIR__ . $path)) {
    if (preg_match('~^/uploads/.*\.php~i', $path)) { http_response_code(403); exit; }
    return false;
}
require __DIR__ . '/index.php';
