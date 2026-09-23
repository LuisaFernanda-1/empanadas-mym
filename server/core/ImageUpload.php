<?php
declare(strict_types=1);

/**
 * Valida y guarda imágenes subidas desde el panel.
 * - Solo JPG/PNG/WEBP, máx. 2 MB (configurable).
 * - Se verifica el tipo REAL del archivo (no la extensión).
 * - Se vuelve a codificar con GD: redimensiona y elimina cualquier contenido ajeno a la imagen.
 * - Cada sitio guarda en su propia carpeta: uploads/{slug}/products/
 */
final class ImageUpload
{
    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    /** @return string ruta relativa a uploads_dir (ej: cafe-del-valle/products/ab12.jpg) */
    public static function store(array $file, string $siteSlug, string $folder = 'products'): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $msg = match ($file['error'] ?? null) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'La imagen supera el tamaño permitido (2 MB).',
                UPLOAD_ERR_NO_FILE => 'Selecciona una imagen.',
                default => 'No se pudo subir la imagen. Inténtalo de nuevo.',
            };
            Http::error($msg, 422, ['field' => 'image']);
        }

        $maxBytes = (int) config('max_image_bytes', 2 * 1024 * 1024);
        if ($file['size'] > $maxBytes) {
            Http::error('La imagen supera el tamaño permitido (2 MB).', 422, ['field' => 'image']);
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        if (!isset(self::TYPES[$mime]) || @getimagesize($file['tmp_name']) === false) {
            Http::error('Formato no permitido. Usa JPG, PNG o WEBP.', 422, ['field' => 'image']);
        }
        $ext = self::TYPES[$mime];

        $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($siteSlug));
        $relDir = $slug . '/' . $folder;
        $absDir = rtrim((string) config('uploads_dir'), '/') . '/' . $relDir;
        if (!is_dir($absDir) && !mkdir($absDir, 0755, true) && !is_dir($absDir)) {
            Http::error('No se pudo crear la carpeta de imágenes.', 500);
        }

        $name = bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = $absDir . '/' . $name;

        if (!self::reencode($file['tmp_name'], $dest, $mime)) {
            // Sin GD disponible: se guarda el original ya validado
            if (!move_uploaded_file($file['tmp_name'], $dest) && !rename($file['tmp_name'], $dest)) {
                Http::error('No se pudo guardar la imagen.', 500);
            }
        }
        @chmod($dest, 0644);

        return $relDir . '/' . $name;
    }

    /** Borra una imagen SOLO si está dentro de la carpeta del sitio indicado. */
    public static function delete(?string $relPath, string $siteSlug): void
    {
        if (!$relPath || !str_starts_with($relPath, $siteSlug . '/') || str_contains($relPath, '..')) {
            return;
        }
        $abs = rtrim((string) config('uploads_dir'), '/') . '/' . $relPath;
        if (is_file($abs)) {
            @unlink($abs);
        }
    }

    private static function reencode(string $src, string $dest, string $mime): bool
    {
        if (!function_exists('imagecreatetruecolor')) {
            return false;
        }
        $img = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($src),
            'image/png'  => @imagecreatefrompng($src),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($src) : false,
            default      => false,
        };
        if (!$img) {
            return false;
        }

        // Corrige la orientación de fotos tomadas con celular
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($src);
            $rot = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
            if ($rot) {
                $img = imagerotate($img, $rot, 0) ?: $img;
            }
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $max = (int) config('image_max_width', 1400);
        if ($w > $max) {
            $nh = (int) round($h * $max / $w);
            $resized = imagecreatetruecolor($max, $nh);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, $max, $nh, $w, $h);
            imagedestroy($img);
            $img = $resized;
        }

        $ok = match ($mime) {
            'image/jpeg' => imagejpeg($img, $dest, 85),
            'image/png'  => (imagesavealpha($img, true) && imagepng($img, $dest, 7)),
            'image/webp' => imagewebp($img, $dest, 85),
            default      => false,
        };
        imagedestroy($img);
        return $ok;
    }
}
