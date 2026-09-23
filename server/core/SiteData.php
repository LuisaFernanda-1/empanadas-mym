<?php
declare(strict_types=1);

/** Arma la información pública de un sitio con el formato que consume el frontend. */
final class SiteData
{
    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }
        if (preg_match('~^https?://~', $path)) {
            return $path;
        }
        return rtrim((string) config('uploads_url'), '/') . '/' . ltrim($path, '/');
    }

    public static function forSite(array $s): array
    {
        $id = (int) $s['id'];
        $paragraphs = array_values(array_filter(array_map('trim', preg_split('/\R\s*\R/', (string) $s['about_text']) ?: [])));

        return [
            'site' => [
                'slug'           => $s['slug'],
                'name'           => $s['name'],
                'logo'           => self::url($s['logo']),
                'showNameInLogo' => (bool) $s['show_name_in_logo'],
                'tagline'        => $s['tagline'],
                'heroTitle'      => $s['hero_title'],
                'heroText'       => $s['hero_text'],
                'heroImage'      => self::url($s['hero_image']),
                'productsLabel'  => $s['products_label'],
                'metaDescription'=> $s['meta_description'],
                'about' => [
                    'title'      => $s['about_title'],
                    'paragraphs' => $paragraphs,
                    'image'      => self::url($s['about_image']),
                    'mission'    => $s['mission'],
                    'vision'     => $s['vision'],
                ],
                'contact' => [
                    'whatsapp'        => preg_replace('/\D/', '', (string) $s['whatsapp']),
                    'whatsappMessage' => $s['whatsapp_message'],
                    'email'           => $s['email'],
                    'phone'           => $s['phone'],
                    'address'         => $s['address'],
                    'city'            => $s['city'],
                    'schedule'        => $s['schedule'],
                    'mapUrl'          => $s['map_url'],
                ],
                'theme' => [
                    'primary'     => $s['color_primary'],
                    'secondary'   => $s['color_secondary'],
                    'accent'      => $s['color_accent'],
                    'fontHeading' => $s['font_heading'],
                    'fontBrand'   => $s['font_brand'],
                ],
            ],
            'features' => Database::all(
                'SELECT icon, title, subtitle FROM site_features WHERE site_id = ? ORDER BY sort_order, id LIMIT 3', [$id]
            ),
            'gallery' => array_map(
                fn ($g) => ['image' => self::url($g['image']), 'caption' => $g['caption']],
                Database::all('SELECT image, caption FROM site_gallery WHERE site_id = ? ORDER BY sort_order, id LIMIT 3', [$id])
            ),
            'socials' => Database::all(
                'SELECT network, url FROM site_socials WHERE site_id = ? ORDER BY sort_order, id', [$id]
            ),
        ];
    }

    public static function product(array $p, bool $admin = false): array
    {
        $out = [
            'id'          => (int) $p['id'],
            'name'        => $p['name'],
            'price'       => $p['price'] === null ? null : (float) $p['price'],
            'description' => $p['short_description'],
            'image'       => self::url($p['image']),
        ];
        if ($admin) {
            $out['isActive'] = (bool) $p['is_active'];
        }
        return $out;
    }
}
