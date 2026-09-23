<?php
declare(strict_types=1);

/**
 * Punto de arranque común para la API, el index.php del sitio y las herramientas CLI.
 */
error_reporting(E_ALL);
ini_set('display_errors', '0');
date_default_timezone_set('America/Bogota');

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Falta core/config.php (copia config.example.php y complétalo).');
}
$GLOBALS['config'] = require $configFile;

spl_autoload_register(function (string $class): void {
    $file = __DIR__ . '/' . str_replace('\\', '/', $class) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

function config(string $key, mixed $default = null): mixed
{
    return $GLOBALS['config'][$key] ?? $default;
}
