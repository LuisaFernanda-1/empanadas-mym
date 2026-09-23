-- =====================================================================
--  Plataforma multi-emprendimiento — Esquema MySQL (MySQL 5.7+ / MariaDB 10.3+)
--  Una sola base de datos para los 45 sitios. Cada fila de negocio
--  pertenece a un sitio (site_id) y el backend SIEMPRE filtra por él.
-- =====================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Sitios (un registro por emprendimiento)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug              VARCHAR(60)  NOT NULL UNIQUE,          -- ej: cafe-del-valle (carpeta de imágenes)
  name              VARCHAR(120) NOT NULL,                 -- Nombre del emprendimiento
  tagline           VARCHAR(160) NULL,                     -- Antetítulo del hero (ej: "CAFÉ DEL VALLE")
  hero_title        VARCHAR(160) NOT NULL,                 -- Título grande del inicio
  hero_text         VARCHAR(400) NOT NULL,                 -- Descripción breve
  hero_image        VARCHAR(255) NULL,                     -- Imagen principal
  logo              VARCHAR(255) NULL,
  show_name_in_logo TINYINT(1)   NOT NULL DEFAULT 1,       -- 0 si el logo ya trae el nombre escrito

  about_title       VARCHAR(160) NULL,
  about_text        TEXT         NULL,                     -- Párrafos separados por línea en blanco
  about_image       VARCHAR(255) NULL,
  mission           TEXT         NULL,
  vision            TEXT         NULL,

  whatsapp          VARCHAR(20)  NOT NULL,                 -- Solo dígitos con indicativo: 573001234567
  whatsapp_message  VARCHAR(255) NULL,                     -- Mensaje inicial predeterminado
  email             VARCHAR(160) NULL,
  phone             VARCHAR(40)  NULL,
  address           VARCHAR(255) NULL,                     -- Ubicación (opcional)
  city              VARCHAR(120) NULL,
  schedule          VARCHAR(255) NULL,                     -- Horario (opcional)
  map_url           VARCHAR(500) NULL,                     -- Enlace de Google Maps (opcional)

  color_primary     CHAR(7)      NOT NULL DEFAULT '#1f6b3a',
  color_secondary   CHAR(7)      NOT NULL DEFAULT '#6b3f24',
  color_accent      CHAR(7)      NOT NULL DEFAULT '#f5efe6',
  font_heading      VARCHAR(60)  NOT NULL DEFAULT 'Outfit',
  font_brand        VARCHAR(60)  NOT NULL DEFAULT 'Lora',

  products_label    VARCHAR(40)  NOT NULL DEFAULT 'Productos', -- "Servicios" si aplica
  meta_description  VARCHAR(300) NULL,
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Dominios -> sitio (así un mismo hosting sirve 45 dominios)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_domains (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id    INT UNSIGNED NOT NULL,
  domain     VARCHAR(190) NOT NULL UNIQUE,                 -- sin "www." y en minúscula
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_domains_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Beneficios destacados bajo el hero (máx. 3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_features (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id    INT UNSIGNED NOT NULL,
  icon       VARCHAR(30)  NOT NULL DEFAULT 'star',        -- nombre de ícono del frontend
  title      VARCHAR(80)  NOT NULL,
  subtitle   VARCHAR(120) NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_features_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Galería (hasta 3 imágenes adicionales)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_gallery (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id    INT UNSIGNED NOT NULL,
  image      VARCHAR(255) NOT NULL,
  caption    VARCHAR(160) NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_gallery_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Redes sociales (opcionales, las que el emprendedor quiera)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_socials (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id    INT UNSIGNED NOT NULL,
  network    ENUM('facebook','instagram','tiktok','youtube','x','linkedin','web') NOT NULL,
  url        VARCHAR(300) NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_socials_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Productos o servicios (máx. 10 por sitio, validado en la API)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id           INT UNSIGNED NOT NULL,
  name              VARCHAR(120) NOT NULL,
  price             DECIMAL(12,2) NULL,                    -- NULL = "Consultar precio"
  short_description VARCHAR(300) NULL,
  image             VARCHAR(255) NULL,
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_site (site_id, is_active, sort_order),
  CONSTRAINT fk_products_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Administrador (UNO por sitio — UNIQUE site_id)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id       INT UNSIGNED NOT NULL UNIQUE,
  email         VARCHAR(160) NOT NULL,
  username      VARCHAR(60)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,                     -- password_hash() de PHP (bcrypt)
  last_login_at DATETIME     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admins_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Intentos de inicio de sesión (freno a fuerza bruta)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id      INT UNSIGNED NOT NULL,
  ip           VARCHAR(45)  NOT NULL,
  attempted_at DATETIME     NOT NULL,
  KEY idx_attempts (site_id, ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Tokens de recuperación de contraseña (expiran en 1 hora)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id    INT UNSIGNED NOT NULL,
  token      CHAR(64) NOT NULL UNIQUE,
  email      VARCHAR(160) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at    DATETIME NULL,
  KEY idx_resets (site_id, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
