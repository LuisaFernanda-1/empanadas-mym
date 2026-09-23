<?php
declare(strict_types=1);

/**
 * Cambia la contraseña del administrador de un emprendimiento.
 *   php tools/cambiar-clave.php cafe-del-valle "NuevaClave2026!"
 * Lista los sitios registrados:
 *   php tools/cambiar-clave.php --listar
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Solo desde la línea de comandos.');
}
require __DIR__ . '/../core/bootstrap.php';

if (($argv[1] ?? '') === '--listar') {
    $rows = Database::all(
        "SELECT s.slug, s.name, a.username, a.email, GROUP_CONCAT(d.domain ORDER BY d.is_primary DESC SEPARATOR ', ') AS domains,
                (SELECT COUNT(*) FROM products p WHERE p.site_id = s.id) AS products
         FROM sites s LEFT JOIN admins a ON a.site_id = s.id LEFT JOIN site_domains d ON d.site_id = s.id
         GROUP BY s.id, a.id ORDER BY s.name"
    );
    foreach ($rows as $r) {
        printf("%-28s %-22s %-28s %2d prod.  %s\n", $r['name'], $r['slug'], $r['username'] . ' <' . $r['email'] . '>', $r['products'], $r['domains']);
    }
    printf("\nTotal: %d emprendimientos\n", count($rows));
    exit(0);
}

[$slug, $pass] = [$argv[1] ?? '', $argv[2] ?? ''];
if ($slug === '' || strlen($pass) < 8) {
    fwrite(STDERR, "Uso: php tools/cambiar-clave.php <slug> <nueva-contraseña (mín. 8 caracteres)>\n");
    exit(1);
}
$n = Database::run(
    'UPDATE admins a JOIN sites s ON s.id = a.site_id SET a.password_hash = ? WHERE s.slug = ?',
    [password_hash($pass, PASSWORD_DEFAULT), $slug]
);
echo $n ? "✔ Contraseña actualizada para $slug\n" : "✖ No existe un administrador para '$slug'\n";
exit($n ? 0 : 1);
