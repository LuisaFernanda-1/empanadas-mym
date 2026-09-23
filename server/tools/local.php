<?php
declare(strict_types=1);

/**
 * SOLO USO LOCAL (lo llaman INICIAR.bat y GUARDAR-RESPALDO.bat).
 * Hace que la carpeta del emprendimiento funcione sola, esté donde esté:
 *
 *   php tools/local.php preparar  <carpeta-xampp>
 *       Enciende MySQL si está apagado.
 *       Si la base de datos no existe, la crea desde database/respaldo.sql
 *       (o, si no hay respaldo, desde schema.sql + la ficha del sitio).
 *       Si ya existe, actualiza database/respaldo.sql con los datos actuales.
 *
 *   php tools/local.php respaldar <carpeta-xampp>
 *       Guarda los datos actuales en database/respaldo.sql.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$cmd   = $argv[1] ?? '';
$xampp = rtrim($argv[2] ?? 'C:\\xampp', '\\/');
$root  = dirname(__DIR__, 2);                       // carpeta del emprendimiento
$cfg   = require __DIR__ . '/../core/config.php';
$db    = $cfg['db'];
$port  = (int) ($db['port'] ?? 3306);
$bin   = $xampp . '\\mysql\\bin\\';
$backup = $root . '/database/respaldo.sql';

function say(string $msg): void { echo $msg, PHP_EOL; }
function fail(string $msg): never { fwrite(STDERR, "ERROR: $msg" . PHP_EOL); exit(1); }

function connect(array $db, int $port): ?PDO
{
    try {
        return new PDO("mysql:host={$db['host']};port=$port;charset=utf8mb4", $db['user'], $db['pass'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 2]);
    } catch (PDOException) {
        return null;
    }
}

/** Ejecuta mysql.exe / mysqldump.exe con la clave por variable de entorno (no queda en pantalla). */
function mysqlTool(string $exe, array $args, array $db, int $port, ?string $in = null, ?string $out = null): void
{
    if (!is_file($exe)) {
        fail("No se encontró $exe");
    }
    $cmd = array_merge([$exe, '-h', $db['host'], '-P', (string) $port, '-u', $db['user']], $args);
    $io  = [0 => $in ? ['file', $in, 'r'] : ['pipe', 'r'], 1 => $out ? ['file', $out, 'w'] : STDOUT, 2 => STDERR];
    $env = array_merge(getenv(), ['MYSQL_PWD' => (string) $db['pass']]);
    $p = proc_open($cmd, $io, $pipes, null, $env);
    if (!is_resource($p) || proc_close($p) !== 0) {
        fail('Falló ' . basename($exe));
    }
}

function dump(string $bin, array $db, int $port, string $backup): void
{
    $tmp = $backup . '.tmp';
    mysqlTool($bin . 'mysqldump.exe', ['--single-transaction', '--routines', '--default-character-set=utf8mb4', $db['name']],
        $db, $port, null, $tmp);
    rename($tmp, $backup);
    say('Respaldo guardado en database/respaldo.sql');
}

// 1. MySQL encendido
$pdo = connect($db, $port);
if ($pdo === null) {
    $mysqld = $bin . 'mysqld.exe';
    if (!is_file($mysqld)) {
        fail("MySQL no está encendido y no se encontró XAMPP en $xampp");
    }
    say('Encendiendo MySQL de XAMPP...');
    pclose(popen('start "MySQL (no cerrar)" /MIN "' . $mysqld . '" --defaults-file="' . $bin . 'my.ini"', 'r'));
    for ($i = 0; $i < 30 && $pdo === null; $i++) {
        sleep(1);
        $pdo = connect($db, $port);
    }
    if ($pdo === null) {
        fail("MySQL no respondió en el puerto $port");
    }
}

$exists = (bool) $pdo->query('SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ' . $pdo->quote($db['name']))->fetchColumn();

if ($cmd === 'respaldar') {
    $exists || fail("La base {$db['name']} no existe");
    dump($bin, $db, $port, $backup);
    exit(0);
}

if ($cmd !== 'preparar') {
    fail('Uso: php tools/local.php preparar|respaldar <carpeta-xampp>');
}

if ($exists) {
    dump($bin, $db, $port, $backup);
    exit(0);
}

// 2. La base no existe (carpeta traída de otro computador): se crea
say("Creando la base de datos {$db['name']}...");
$pdo->exec('CREATE DATABASE `' . str_replace('`', '', $db['name']) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

if (is_file($backup)) {
    mysqlTool($bin . 'mysql.exe', ['--default-character-set=utf8mb4', $db['name']], $db, $port, $backup);
    say('Datos restaurados desde database/respaldo.sql');
    exit(0);
}

mysqlTool($bin . 'mysql.exe', ['--default-character-set=utf8mb4', $db['name']], $db, $port, $root . '/database/schema.sql');
$slug = (string) ($cfg['dev_default_site'] ?? '');
$ficha = $root . '/sitios/' . $slug;
is_dir($ficha) || fail("No hay respaldo ni ficha en sitios/$slug");
chdir(dirname(__DIR__));
passthru(escapeshellarg(PHP_BINARY) . ' tools/nuevo-sitio.php ' . escapeshellarg($ficha), $code);
$code === 0 || fail('No se pudo cargar la ficha');
dump($bin, $db, $port, $backup);
