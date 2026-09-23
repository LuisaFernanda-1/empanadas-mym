<?php
declare(strict_types=1);

/**
 * API REST — un solo archivo de rutas para todos los emprendimientos.
 * El sitio se determina por el dominio (Tenant) y TODAS las consultas
 * filtran por su site_id.
 *
 *  Público
 *   GET    /api/site                     Información del emprendimiento
 *   GET    /api/products                 Productos activos
 *   GET    /api/products/{id}            Detalle de un producto
 *  Autenticación
 *   POST   /api/auth/login               {usuario, contrasena}
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 *  Panel (requiere sesión + X-CSRF-Token)
 *   GET    /api/admin/products
 *   POST   /api/admin/products           multipart: name, price, description, is_active, image
 *   POST   /api/admin/products/{id}      multipart (actualizar; image opcional)
 *   DELETE /api/admin/products/{id}
 */

require __DIR__ . '/../core/bootstrap.php';

set_exception_handler(function (Throwable $e): void {
    error_log('[API] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Http::error(config('dev_mode') ? $e->getMessage() : 'Ocurrió un error inesperado.', 500);
});

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . trim((string) preg_replace('~^.*?/api~', '', $path, 1), '/');
$method = Http::method();

// ------------------------------------------------------------------ Público
if ($method === 'GET' && $path === '/site') {
    Http::json(SiteData::forSite(Tenant::require()));
}

if ($method === 'GET' && $path === '/products') {
    $rows = Database::all(
        'SELECT * FROM products WHERE site_id = ? AND is_active = 1 ORDER BY sort_order, id',
        [Tenant::id()]
    );
    Http::json(array_map([SiteData::class, 'product'], $rows));
}

if ($method === 'GET' && preg_match('~^/products/(\d+)$~', $path, $m)) {
    $row = Database::one(
        'SELECT * FROM products WHERE id = ? AND site_id = ? AND is_active = 1',
        [(int) $m[1], Tenant::id()]
    );
    $row ?? Http::error('Producto no encontrado.', 404);
    Http::json(SiteData::product($row));
}

// ------------------------------------------------------------------ Contacto
if ($method === 'POST' && $path === '/contact') {
    $in = Http::input();
    $name    = trim((string) ($in['name']    ?? ''));
    $email   = trim((string) ($in['email']   ?? ''));
    $message = trim((string) ($in['message'] ?? ''));

    // Campo trampa invisible: solo un robot lo llena. Se responde "ok" sin enviar nada.
    if (trim((string) ($in['website'] ?? '')) !== '') {
        Http::json(['ok' => true]);
    }
    if ($name === ''|| $email === '' || $message === '') {
        Http::error('Todos los campos son obligatorios.', 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Http::error('El correo no es válido.', 422);
    }
    if (mb_strlen($message) > 2000) {
        Http::error('El mensaje es demasiado largo (máximo 2000 caracteres).', 422);
    }

    $site = Tenant::require();
    $to = $site['email'] ?? null;
    if (!$to) {
        Http::error('Este emprendimiento no tiene correo de contacto configurado.', 503);
    }

    $subject = "Atención al cliente: mensaje de {$name} — {$site['name']}";
    $body = "Nuevo mensaje desde el formulario de atención al cliente de la página web.\n\n"
          . "Nombre: {$name}\nCorreo: {$email}\n\nMensaje:\n{$message}\n\n"
          . "Para responderle, usa el botón \"Responder\" de tu correo.";
    Mailer::send($to, $subject, $body, $email);
    Http::json(['ok' => true]);
}

// ------------------------------------------------------------------ Autenticación
if ($method === 'POST' && $path === '/auth/login') {
    Auth::start();
    $in = Http::input();
    $login = trim((string) ($in['usuario'] ?? ''));
    $pass = (string) ($in['contrasena'] ?? '');
    if ($login === '' || $pass === '') {
        Http::error('Escribe tu usuario o correo y tu contraseña.', 422);
    }
    Http::json(['user' => Auth::attempt($login, $pass)]);
}

if ($method === 'POST' && $path === '/auth/logout') {
    Auth::start();
    Auth::logout();
    Http::json(['ok' => true]);
}

if ($method === 'GET' && $path === '/auth/me') {
    $user = Auth::user();
    $user ?? Http::error('Sin sesión.', 401);
    Http::json(['user' => $user]);
}

if ($method === 'POST' && $path === '/auth/forgot') {
    $in = Http::input();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Http::error('Escribe un correo electrónico válido.', 422);
    }

    $siteId = Tenant::id();
    $admin  = Database::one(
        'SELECT * FROM admins WHERE site_id = ? AND LOWER(email) = ?',
        [$siteId, $email]
    );

    // Respuesta genérica para no revelar si el correo existe
    if ($admin !== null) {
        Database::run(
            'DELETE FROM password_resets WHERE site_id = ? AND email = ?',
            [$siteId, $email]
        );
        $token = bin2hex(random_bytes(32));
        Database::run(
            'INSERT INTO password_resets (site_id, token, email, created_at) VALUES (?, ?, ?, NOW())',
            [$siteId, $token, $email]
        );

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $base   = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $link   = "{$base}/admin/nueva-contrasena?token={$token}";

        $site = Tenant::require();
        $subject = "Recupera tu contraseña — {$site['name']}";
        $body    = "Hola,\n\nRecibimos una solicitud para restablecer la contraseña de tu panel.\n"
                 . "Haz clic en el siguiente enlace (válido por 1 hora):\n\n{$link}\n\n"
                 . "Si no solicitaste esto, ignora este correo.\n\n— {$site['name']}";
        Mailer::send($email, $subject, $body);
    }

    Http::json(['ok' => true]);
}

if ($method === 'POST' && $path === '/auth/reset') {
    $in       = Http::input();
    $token    = trim((string) ($in['token']    ?? ''));
    $password = (string) ($in['password'] ?? '');

    if (strlen($token) !== 64 || $password === '') {
        Http::error('Solicitud inválida.', 422);
    }
    if (strlen($password) < 8) {
        Http::error('La contraseña debe tener al menos 8 caracteres.', 422);
    }

    $siteId = Tenant::id();
    $reset  = Database::one(
        'SELECT * FROM password_resets
         WHERE site_id = ? AND token = ? AND used_at IS NULL
           AND created_at > (NOW() - INTERVAL 1 HOUR)',
        [$siteId, $token]
    );

    if ($reset === null) {
        Http::error('El enlace no es válido o ya expiró. Solicita uno nuevo.', 422);
    }

    Database::run(
        'UPDATE admins SET password_hash = ? WHERE site_id = ? AND LOWER(email) = ?',
        [password_hash($password, PASSWORD_DEFAULT), $siteId, strtolower($reset['email'])]
    );
    Database::run(
        'UPDATE password_resets SET used_at = NOW() WHERE id = ?',
        [$reset['id']]
    );

    Http::json(['ok' => true]);
}

// ------------------------------------------------------------------ Panel: productos
if (str_starts_with($path, '/admin/')) {
    Auth::requireAdmin();
    $site = Tenant::require();
    $siteId = (int) $site['id'];

    if ($method === 'GET' && $path === '/admin/products') {
        $rows = Database::all('SELECT * FROM products WHERE site_id = ? ORDER BY sort_order, id', [$siteId]);
        Http::json([
            'items' => array_map(fn ($r) => SiteData::product($r, true), $rows),
            'max'   => (int) config('max_products', 10),
        ]);
    }

    if ($method === 'POST' && $path === '/admin/products') {
        $count = (int) Database::one('SELECT COUNT(*) AS n FROM products WHERE site_id = ?', [$siteId])['n'];
        $max = (int) config('max_products', 10);
        if ($count >= $max) {
            Http::error("Llegaste al máximo de {$max} productos. Elimina uno para agregar otro.", 422);
        }
        $data = validateProduct(Http::input());
        if (empty($_FILES['image']) || ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            Http::error('La imagen del producto es obligatoria.', 422, ['field' => 'image']);
        }
        $image = ImageUpload::store($_FILES['image'], $site['slug']);
        $nextSort = (int) Database::one('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM products WHERE site_id = ?', [$siteId])['n'];

        $id = Database::insert(
            'INSERT INTO products (site_id, name, price, short_description, image, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$siteId, $data['name'], $data['price'], $data['description'], $image, $data['is_active'], $nextSort]
        );
        $row = Database::one('SELECT * FROM products WHERE id = ?', [$id]);
        Http::json(SiteData::product($row, true), 201);
    }

    if (preg_match('~^/admin/products/(\d+)$~', $path, $m)) {
        $current = Database::one('SELECT * FROM products WHERE id = ? AND site_id = ?', [(int) $m[1], $siteId]);
        $current ?? Http::error('Producto no encontrado.', 404);

        if ($method === 'POST') {
            $data = validateProduct(Http::input());
            $image = $current['image'];
            if (!empty($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $image = ImageUpload::store($_FILES['image'], $site['slug']);
                ImageUpload::delete($current['image'], $site['slug']);
            }
            Database::run(
                'UPDATE products SET name = ?, price = ?, short_description = ?, image = ?, is_active = ?
                 WHERE id = ? AND site_id = ?',
                [$data['name'], $data['price'], $data['description'], $image, $data['is_active'], $current['id'], $siteId]
            );
            $row = Database::one('SELECT * FROM products WHERE id = ?', [$current['id']]);
            Http::json(SiteData::product($row, true));
        }

        if ($method === 'DELETE') {
            Database::run('DELETE FROM products WHERE id = ? AND site_id = ?', [$current['id'], $siteId]);
            ImageUpload::delete($current['image'], $site['slug']);
            Http::json(['ok' => true]);
        }
    }
}

Http::error('Ruta no encontrada.', 404);

// ------------------------------------------------------------------ Validación
function validateProduct(array $in): array
{
    $name = trim((string) ($in['name'] ?? ''));
    $description = trim((string) ($in['description'] ?? ''));
    $priceRaw = trim((string) ($in['price'] ?? ''));

    if ($name === '' || mb_strlen($name) > 120) {
        Http::error('El nombre es obligatorio (máximo 120 caracteres).', 422, ['field' => 'name']);
    }
    if (mb_strlen($description) > 300) {
        Http::error('La descripción corta admite máximo 300 caracteres.', 422, ['field' => 'description']);
    }

    $price = null;                                  // vacío = "Consultar precio"
    if ($priceRaw !== '') {
        $normalized = str_replace(['$', ' ', '.'], '', $priceRaw);   // "18.000" -> "18000"
        $normalized = str_replace(',', '.', $normalized);
        if (!is_numeric($normalized) || (float) $normalized < 0 || (float) $normalized > 9999999999) {
            Http::error('El precio debe ser un número válido.', 422, ['field' => 'price']);
        }
        $price = round((float) $normalized, 2);
    }

    $active = $in['is_active'] ?? '1';
    return [
        'name'        => $name,
        'description' => $description === '' ? null : $description,
        'price'       => $price,
        'is_active'   => in_array((string) $active, ['1', 'true', 'on'], true) ? 1 : 0,
    ];
}
