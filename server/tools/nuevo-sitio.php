<?php
declare(strict_types=1);

/**
 * CREA O ACTUALIZA UN EMPRENDIMIENTO A PARTIR DE SU FICHA
 * ---------------------------------------------------------------------
 *  Cada emprendimiento es una carpeta con:
 *     ficha.json   (datos: nombre, colores, textos, productos, contacto...)
 *     logo, imagen principal, imagen de "quiénes somos", galería y productos
 *
 *  Uso (desde la carpeta public_html por SSH, o en tu computador):
 *     php tools/nuevo-sitio.php ../sitios/cafe-del-valle
 *     php tools/nuevo-sitio.php ../sitios/cafe-del-valle --sql=cafe.sql   (genera SQL para phpMyAdmin)
 *
 *  Opciones:
 *     --sql=archivo.sql      No toca la base: escribe el SQL para importarlo en phpMyAdmin
 *     --reset-productos      Borra los productos actuales y carga los de la ficha
 *     --reset-clave          Vuelve a poner la contraseña inicial de la ficha
 *     --reset-imagenes       Vuelve a poner logo, portada, "Quiénes somos" y galería de la ficha
 *                            (por defecto se respetan las que el emprendedor cambió en su panel)
 *
 *  Es seguro ejecutarlo varias veces: actualiza la información del sitio
 *  pero NO borra los productos que el emprendedor ya editó en su panel.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Solo desde la línea de comandos.');
}

require __DIR__ . '/../core/bootstrap.php';

$args = array_slice($argv, 1);
$dir = null;
$opts = [];
foreach ($args as $a) {
    if (str_starts_with($a, '--')) {
        [$k, $v] = array_pad(explode('=', substr($a, 2), 2), 2, true);
        $opts[$k] = $v;
    } else {
        $dir = rtrim($a, '/');
    }
}
if (!$dir || !is_file("$dir/ficha.json")) {
    fwrite(STDERR, "Uso: php tools/nuevo-sitio.php <carpeta-del-emprendimiento> [--sql=archivo.sql] [--reset-productos] [--reset-imagenes] [--reset-clave]\n");
    exit(1);
}

$f = json_decode((string) file_get_contents("$dir/ficha.json"), true);
if (!is_array($f)) {
    fail('ficha.json no es un JSON válido: ' . json_last_error_msg());
}

// ------------------------------------------------------------------ Validación
$errors = [];
$warnings = [];
$slug = strtolower((string) ($f['slug'] ?? ''));
if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) $errors[] = 'slug: solo minúsculas, números y guiones (ej: cafe-del-valle).';
if (empty($f['nombre'])) $errors[] = 'nombre es obligatorio.';
if (empty($f['inicio']['titulo'])) $errors[] = 'inicio.titulo es obligatorio.';
if (empty($f['inicio']['descripcion'])) $errors[] = 'inicio.descripcion es obligatoria.';
$wa = preg_replace('/\D/', '', (string) ($f['contacto']['whatsapp'] ?? ''));
if (strlen($wa) < 10) $errors[] = 'contacto.whatsapp debe incluir indicativo (ej: 573001234567).';
if (count($f['productos'] ?? []) > (int) config('max_products', 10)) $errors[] = 'Máximo ' . config('max_products', 10) . ' productos.';
if (count($f['galeria'] ?? []) > 3) $errors[] = 'Máximo 3 imágenes de galería.';
if (count($f['inicio']['beneficios'] ?? []) > 3) $errors[] = 'Máximo 3 beneficios.';
if (empty($f['dominios'])) $errors[] = 'Agrega al menos un dominio.';
if (empty($f['administrador']['correo']) || empty($f['administrador']['usuario'])) $errors[] = 'administrador.correo y administrador.usuario son obligatorios.';
foreach (['principal', 'secundario', 'fondo_suave'] as $c) {
    $val = $f['colores'][$c] ?? null;
    if ($val !== null && !preg_match('/^#[0-9a-fA-F]{6}$/', $val)) $errors[] = "colores.$c debe ser un color hexadecimal (#1f6b3a).";
}
foreach ($f['productos'] ?? [] as $i => $p) {
    if (empty($p['nombre'])) $errors[] = "productos[$i]: falta el nombre.";
    if (mb_strlen((string) ($p['descripcion'] ?? '')) > 300) $errors[] = "productos[$i]: la descripción supera 300 caracteres.";
}
if ($errors) {
    fail("La ficha tiene errores:\n  - " . implode("\n  - ", $errors));
}

// ------------------------------------------------------------------ Imágenes
$uploadsDir = rtrim((string) config('uploads_dir'), '/');
$copy = function (?string $file, string $sub = '') use ($dir, $slug, $uploadsDir, &$warnings): ?string {
    if (!$file) return null;
    $src = "$dir/imagenes/$file";
    if (!is_file($src)) $src = "$dir/$file";
    if (!is_file($src)) { $warnings[] = "No se encontró la imagen $file"; return null; }
    $ext = strtolower(pathinfo($src, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'svg'], true)) { $warnings[] = "$file: formato no permitido"; return null; }
    if (filesize($src) > (int) config('max_image_bytes')) $warnings[] = "$file pesa más de 2 MB (conviene optimizarla).";
    $rel = $slug . ($sub ? "/$sub" : '') . '/' . basename($src);
    $dest = "$uploadsDir/$rel";
    if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
    copy($src, $dest);
    return $rel;
};

$logo = $copy($f['logo'] ?? null);
$hero = $copy($f['inicio']['imagen_principal'] ?? null);
$about = $copy($f['quienes_somos']['imagen'] ?? null);

// ------------------------------------------------------------------ Sentencias SQL
$q = [];   // [sql, params]
$siteCols = [
    'slug' => $slug,
    'name' => $f['nombre'],
    'tagline' => $f['inicio']['antetitulo'] ?? $f['nombre'],
    'hero_title' => $f['inicio']['titulo'],
    'hero_text' => $f['inicio']['descripcion'],
    'hero_image' => $hero,
    'logo' => $logo,
    'show_name_in_logo' => ($f['mostrar_nombre_junto_al_logo'] ?? true) ? 1 : 0,
    'about_title' => $f['quienes_somos']['titulo'] ?? null,
    'about_text' => $f['quienes_somos']['texto'] ?? null,
    'about_image' => $about,
    'mission' => $f['quienes_somos']['mision'] ?? null,
    'vision' => $f['quienes_somos']['vision'] ?? null,
    'whatsapp' => $wa,
    'whatsapp_message' => $f['contacto']['mensaje_whatsapp'] ?? null,
    'email' => $f['contacto']['correo'] ?? null,
    'phone' => $f['contacto']['telefono'] ?? null,
    'address' => $f['contacto']['direccion'] ?? null,
    'city' => $f['contacto']['ciudad'] ?? null,
    'schedule' => $f['contacto']['horario'] ?? null,
    'map_url' => $f['contacto']['mapa_url'] ?? null,
    'color_primary' => $f['colores']['principal'] ?? '#1f6b3a',
    'color_secondary' => $f['colores']['secundario'] ?? '#6b3f24',
    'color_accent' => $f['colores']['fondo_suave'] ?? '#f6f1e9',
    'font_heading' => $f['fuentes']['titulos'] ?? 'Outfit',
    'font_brand' => $f['fuentes']['marca'] ?? 'Lora',
    'products_label' => $f['etiqueta_productos'] ?? 'Productos',
    'meta_description' => $f['seo_descripcion'] ?? null,
];
$cols = array_keys($siteCols);
// Logo, portada y "Quiénes somos" se pueden cambiar desde el panel: al actualizar la ficha
// no se pisan (solo al crear el sitio o con --reset-imagenes), igual que los productos.
$keepImages = isset($opts['reset-imagenes']) ? [] : ['logo', 'hero_image', 'about_image'];
$update = implode(', ', array_map(fn ($c) => "$c = VALUES($c)", array_diff($cols, ['slug'], $keepImages)));
$q[] = ['INSERT INTO sites (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ")
        ON DUPLICATE KEY UPDATE $update, id = LAST_INSERT_ID(id)", array_values($siteCols)];
$q[] = ['SET @site_id = LAST_INSERT_ID()', []];

// Dominios
$q[] = ['DELETE FROM site_domains WHERE site_id = @site_id', []];
foreach (array_values($f['dominios']) as $i => $d) {
    $q[] = ['INSERT INTO site_domains (site_id, domain, is_primary) VALUES (@site_id, ?, ?)', [Tenant::normalizeHost((string) $d), $i === 0 ? 1 : 0]];
}

// Beneficios, galería, redes (se reemplazan)
$q[] = ['DELETE FROM site_features WHERE site_id = @site_id', []];
foreach (array_values($f['inicio']['beneficios'] ?? []) as $i => $b) {
    $q[] = ['INSERT INTO site_features (site_id, icon, title, subtitle, sort_order) VALUES (@site_id, ?, ?, ?, ?)',
        [$b['icono'] ?? 'star', $b['titulo'], $b['subtitulo'] ?? null, $i]];
}
// Galería: también se administra desde el panel; solo se carga si está vacía (o con --reset-imagenes)
if (isset($opts['reset-imagenes'])) {
    $q[] = ['DELETE FROM site_gallery WHERE site_id = @site_id', []];
}
$q[] = ['SET @had_gallery = (SELECT COUNT(*) FROM site_gallery WHERE site_id = @site_id)', []];
foreach (array_values($f['galeria'] ?? []) as $i => $g) {
    $img = $copy($g['imagen'] ?? null, 'gallery');
    if ($img) {
        $q[] = ['INSERT INTO site_gallery (site_id, image, caption, sort_order) SELECT @site_id, ?, ?, ? FROM DUAL WHERE @had_gallery = 0',
            [$img, $g['descripcion'] ?? null, $i]];
    }
}
$q[] = ['DELETE FROM site_socials WHERE site_id = @site_id', []];
$networks = ['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'web'];
foreach (array_values($f['redes'] ?? []) as $i => $r) {
    if (!in_array($r['red'] ?? '', $networks, true) || empty($r['url'])) { $warnings[] = 'Red social ignorada: ' . json_encode($r); continue; }
    $q[] = ['INSERT INTO site_socials (site_id, network, url, sort_order) VALUES (@site_id, ?, ?, ?)', [$r['red'], $r['url'], $i]];
}

// Productos: solo si el sitio aún no tiene (o con --reset-productos)
if (isset($opts['reset-productos'])) {
    $q[] = ['DELETE FROM products WHERE site_id = @site_id', []];
}
$q[] = ['SET @had_products = (SELECT COUNT(*) FROM products WHERE site_id = @site_id)', []];
foreach (array_values($f['productos'] ?? []) as $i => $p) {
    $img = $copy($p['imagen'] ?? null, 'products');
    $price = isset($p['precio']) && $p['precio'] !== '' && $p['precio'] !== null ? (float) $p['precio'] : null;
    $q[] = ['INSERT INTO products (site_id, name, price, short_description, image, is_active, sort_order)
             SELECT @site_id, ?, ?, ?, ?, 1, ? FROM DUAL WHERE @had_products = 0',
        [$p['nombre'], $price, $p['descripcion'] ?? null, $img, $i + 1]];
}

// Administrador (uno por sitio). La contraseña solo se fija al crearlo o con --reset-clave
$adm = $f['administrador'];
$pass = (string) ($adm['contrasena_inicial'] ?? '');
if (strlen($pass) < 8) {
    $pass = rtrim(strtr(base64_encode(random_bytes(9)), '+/', 'Ab'), '=');
    // Solo se avisa si esta clave de verdad se va a usar: administrador nuevo o --reset-clave
    $adminExists = !isset($opts['sql']) && Database::one(
        'SELECT a.id FROM admins a JOIN sites s ON s.id = a.site_id WHERE s.slug = ?', [$slug]
    ) !== null;
    if (!$adminExists || isset($opts['reset-clave'])) {
        $warnings[] = "Contraseña inicial generada automáticamente: $pass";
    }
}
$hash = password_hash($pass, PASSWORD_DEFAULT);
$onDup = 'email = VALUES(email), username = VALUES(username)' . (isset($opts['reset-clave']) ? ', password_hash = VALUES(password_hash)' : '');
$q[] = ["INSERT INTO admins (site_id, email, username, password_hash) VALUES (@site_id, ?, ?, ?) ON DUPLICATE KEY UPDATE $onDup",
    [strtolower($adm['correo']), $adm['usuario'], $hash]];

// ------------------------------------------------------------------ Ejecutar o exportar
if (isset($opts['sql'])) {
    $out = "-- Emprendimiento: {$f['nombre']} ({$slug}) — generado " . date('Y-m-d H:i') . "\n"
         . "-- Importar en phpMyAdmin DESPUÉS de schema.sql\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n";
    foreach ($q as [$sql, $params]) {
        $out .= interpolate($sql, $params) . ";\n";
    }
    $out .= "COMMIT;\n";
    $file = is_string($opts['sql']) ? $opts['sql'] : "$slug.sql";
    file_put_contents($file, $out);
    echo "✔ SQL generado en $file\n";
} else {
    $pdo = Database::pdo();
    $pdo->beginTransaction();
    try {
        foreach ($q as [$sql, $params]) {
            $st = $pdo->prepare($sql);
            $st->execute($params);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        $msg = $e->getMessage();
        if (str_contains($msg, 'site_domains') || str_contains($msg, "for key 'domain'")) {
            $msg = 'Uno de los dominios ya pertenece a otro emprendimiento. ' . $msg;
        }
        fail($msg);
    }
    echo "✔ Emprendimiento \"{$f['nombre']}\" guardado en la base de datos.\n";
}

echo "  Imágenes copiadas en: uploads/$slug/\n";
echo "  Dominios: " . implode(', ', $f['dominios']) . "\n";
echo "  Panel: https://{$f['dominios'][0]}/admin  (usuario: {$adm['usuario']})\n";
foreach ($warnings as $w) {
    echo "  ⚠ $w\n";
}

// ------------------------------------------------------------------ Utilidades
function fail(string $msg): never
{
    fwrite(STDERR, "✖ $msg\n");
    exit(1);
}

function interpolate(string $sql, array $params): string
{
    $i = 0;
    return preg_replace_callback('/\?/', function () use (&$i, $params) {
        $v = $params[$i++] ?? null;
        if ($v === null) return 'NULL';
        if (is_int($v) || is_float($v)) return (string) $v;
        return "'" . strtr((string) $v, ["\\" => "\\\\", "'" => "\\'", "\0" => "\\0", "\n" => "\\n", "\r" => "\\r", "\x1a" => "\\Z"]) . "'";
    }, $sql);
}
