<?php
/**
 * Copia este archivo como config.php y completa los datos de tu base MySQL
 * (en Hostinger: hPanel → Bases de datos → Administración).
 * config.php NUNCA se sube a un repositorio público.
 */
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'u123456789_emprendimientos',
        'user' => 'u123456789_admin',
        'pass' => 'CONTRASEÑA_SEGURA',
    ],

    // Solo en tu computador: permite elegir el sitio con ?sitio=slug
    // cuando el dominio no coincide (localhost). En Hostinger: false.
    'dev_mode'         => false,
    'dev_default_site' => 'cafe-del-valle',

    // Carpeta física y URL pública de las imágenes subidas
    'uploads_dir' => __DIR__ . '/../uploads',
    'uploads_url' => '/uploads',

    // Reglas del negocio
    'max_products'     => 10,
    'max_image_bytes'  => 2 * 1024 * 1024,   // 2 MB por imagen
    'image_max_width'  => 1400,              // se redimensiona al subir

    // Sesión del panel administrativo
    'session_name'     => 'emp_admin',
    'session_lifetime' => 60 * 60 * 8,       // 8 horas
    'login_max_attempts' => 5,               // intentos fallidos...
    'login_window_minutes' => 15,            // ...en esta ventana
];
