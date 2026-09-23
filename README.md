# Plataforma de sitios para emprendimientos

Una sola plantilla (Vue 3 + JSX + Vite · PHP · MySQL) que sirve **45 páginas web independientes** desde **un solo hosting de Hostinger**. Cada dominio muestra únicamente la información, los productos y el panel de su emprendimiento.

Sitio de referencia incluido: **Café del Valle** (datos ficticios).

---

## Carpeta independiente (doble clic)

Esta carpeta funciona sola, en cualquier lugar (escritorio, USB, otra carpeta):

- **INICIAR.bat** → enciende MySQL de XAMPP si hace falta, abre el sitio en el navegador y lo deja corriendo mientras la ventana esté abierta. Si la base de datos no existe (por ejemplo, en otro computador), la crea sola desde `database/respaldo.sql`.
- **GUARDAR-RESPALDO.bat** → guarda los datos actuales en `database/respaldo.sql`. INICIAR también lo actualiza cada vez que arranca.

Único requisito: XAMPP instalado en `C:\xampp` (si está en otra ruta, cámbiala en los dos .bat).

## Vista de muestra en GitHub Pages

`docs/index.html` es una copia del sitio en un solo archivo que funciona sin PHP ni MySQL, para enviar un enlace y que otra persona lo vea.

- Se genera con `cd frontend && npm run build:demo` (vuelve a ejecutarlo después de cambiar el diseño o la ficha, y sube el cambio).
- Toma los datos de `sitios/empanadas-mym/ficha.json`, no de la base de datos.
- Panel de muestra: usuario `demo` · contraseña `demo2026`. Los cambios se borran al recargar y el formulario de contacto no envía correos.
- En GitHub: *Settings → Pages → Branch `main` / carpeta `/docs`*.

`.gitignore` deja fuera los archivos privados: `config.php` (clave de Gmail), `CREDENCIALES-LOCAL.txt`, `database/respaldo.sql` y las notas internas.

---

## 1. Cómo funciona

```
cafedelvalle.com ─┐                         ┌─ sites (1 fila por emprendimiento)
panaderiarosa.com ─┼─► public_html (mismo código) ─► Tenant.php ─► site_domains ─► products, gallery, socials, admins
... 45 dominios ──┘        index.php + api/            (dominio → site_id)       (todo filtrado por site_id)
```

1. Todos los dominios apuntan a la **misma carpeta** del hosting.
2. `core/Tenant.php` lee el dominio de la visita (`www.` y puerto se ignoran), lo busca en `site_domains` y obtiene el `site_id`.
3. **Toda** consulta de la API filtra por ese `site_id`. Un producto de otro sitio responde "no encontrado", aunque se adivine su id.
4. Cada administrador pertenece a un solo sitio (`admins.site_id` es UNIQUE). Su sesión se invalida si se usa en otro dominio.
5. `index.php` inyecta en el HTML el título, la descripción SEO, los colores, las fuentes y los datos iniciales del emprendimiento. La página carga sin parpadeo y Google indexa el nombre correcto.

**Para agregar un emprendimiento no se programa nada:** se llena su `ficha.json`, se ponen sus imágenes en una carpeta y se ejecuta un comando.

---

## 2. Estructura

```
emprendimientos/
├── database/schema.sql          ← tablas (ejecutar una sola vez)
├── sitios/
│   ├── _plantilla/ficha.json    ← ficha vacía para copiar
│   ├── cafe-del-valle/          ← ejemplo completo
│   │   ├── ficha.json
│   │   └── imagenes/            (logo, principal, quiénes somos, galería, productos)
│   └── CHECKLIST-EMPRENDEDOR.md ← qué pedirle a cada emprendedor
├── frontend/                    ← código fuente Vue 3 + JSX
│   └── src/
│       ├── components/          Brand, SiteHeader, SiteFooter, ProductCard, Icon, WhatsAppFloat…
│       ├── sections/            HeroSlider, FeatureStrip, ProductGrid, AboutBlock, GalleryGrid, ContactBlock
│       ├── views/               Inicio, Quiénes somos, Productos, Detalle, Galería, Contacto
│       ├── admin/               Login, Layout, Productos, Formulario, Confirmación
│       ├── store/               site.js (datos + tema), auth.js (sesión)
│       └── services/            http.js (API real), demo.js (vista previa sin servidor)
└── server/                      ← CONTENIDO DE public_html (ya compilado)
    ├── index.php                entrada de todas las páginas
    ├── .htaccess                rutas limpias, HTTPS, caché, bloqueos
    ├── api/index.php            API REST
    ├── assets/                  JS/CSS generados por Vite
    ├── core/                    PHP interno + config.php + template.html (acceso bloqueado)
    ├── tools/                   nuevo-sitio.php, cambiar-clave.php (solo por consola)
    └── uploads/{slug}/          imágenes de cada emprendimiento (carpeta separada)
```

---

## 3. Probar en tu computador

Requisitos: PHP 8.1+ (con pdo_mysql, gd y fileinfo), MySQL o MariaDB, y Node 18+.

```bash
# Base de datos
mysql -u root -e "CREATE DATABASE emprendimientos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root emprendimientos < database/schema.sql

# Configuración (pon tus datos y deja 'dev_mode' => true)
cp server/core/config.example.php server/core/config.php

# Cargar Café del Valle
cd server
php tools/nuevo-sitio.php ../sitios/cafe-del-valle

# API + sitio compilado
php -S localhost:8080 dev-router.php         # abre http://localhost:8080

# Para editar el diseño con recarga en vivo (otra terminal)
cd ../frontend && npm install && npm run dev # abre http://localhost:5173
```

En local, el dominio es `localhost`, así que `dev_mode` carga el sitio por defecto. Para ver otro sitio usa `?sitio=slug`, por ejemplo `http://localhost:8080/?sitio=panaderia-rosa`.

Panel: `/admin` · el usuario y la clave están en `CREDENCIALES-LOCAL.txt` (no se sube a Git).

Si cambias algo en `frontend/`, ejecuta `npm run build`. El resultado se escribe directamente en `server/`.

---

## 4. Publicar en Hostinger (una vez)

Plan recomendado: uno que incluya **acceso SSH** y **MySQL** (Premium/Business o superior). Antes de contratar, confirma con Hostinger cuántos dominios estacionados o sitios admite el plan.

1. **Base de datos:** hPanel → *Bases de datos* → crea la base y el usuario. En phpMyAdmin, importa `database/schema.sql`.
2. **Archivos:** sube **el contenido** de `server/` a `public_html/` del dominio principal. Usa el *Administrador de archivos* o FTP y activa la opción de ver archivos ocultos para que se suba `.htaccess`. No subas `dev-router.php`.
3. **Configuración:** en `public_html/core/`, copia `config.example.php` como `config.php` y escribe los datos de la base. Deja `'dev_mode' => false`.
4. **PHP:** hPanel → *Avanzado* → *Configuración PHP*. Elige PHP 8.1 o superior y verifica que estén activas `pdo_mysql`, `gd` y `fileinfo`.
5. **Permisos:** la carpeta `uploads/` debe tener permisos 755.

### Conectar los dominios (opción recomendada: dominios estacionados)
Por cada emprendimiento:
1. hPanel → *Sitios web* → tu sitio principal → **Dominios estacionados (Parked Domains)** → escribe `dominio.com` → *Estacionar*.
2. Apunta el DNS del dominio a Hostinger con sus nameservers o con el registro A del plan.
3. Activa el **SSL** para ese dominio en hPanel → *Seguridad* → *SSL*.
4. Ejecuta `nuevo-sitio.php` con la ficha del emprendimiento (siguiente sección). En la ficha deben ir **los mismos dominios**.

Un dominio estacionado muestra el contenido del sitio principal y la plantilla decide por el dominio qué emprendimiento mostrar. Así, **actualizar la plantilla una vez actualiza los 45 sitios**.

> **Alternativa:** si prefieres que cada dominio sea un "sitio web" independiente en hPanel, sube la misma carpeta `server/` a cada uno con el mismo `config.php`. Todo sigue funcionando porque el sitio se identifica por el dominio, pero cada actualización hay que repetirla 45 veces.

---

## 5. Agregar un emprendimiento (≈10 minutos)

1. Copia `sitios/_plantilla/` como `sitios/nombre-del-negocio/`.
2. Llena `ficha.json` con lo que entregó el emprendedor (ver `CHECKLIST-EMPRENDEDOR.md`).
3. Pon las imágenes en `imagenes/` con los nombres que usaste en la ficha.
4. Ejecuta:

```bash
# Con SSH en Hostinger (sube antes la carpeta del sitio, por ejemplo a ~/sitios/)
cd ~/domains/TU-DOMINIO-PRINCIPAL/public_html
php tools/nuevo-sitio.php ~/sitios/nombre-del-negocio
```

**Sin SSH:** ejecútalo en tu computador con `--sql`:
```bash
php tools/nuevo-sitio.php ../sitios/nombre-del-negocio --sql=nombre.sql
```
Luego importa `nombre.sql` en phpMyAdmin y sube la carpeta `server/uploads/nombre-del-negocio/` a `public_html/uploads/`.

El comando valida la ficha: máximo 10 productos, 3 imágenes de galería, WhatsApp con indicativo, colores en formato hexadecimal y peso de las imágenes. Puedes ejecutarlo de nuevo cuando cambie la información del negocio. Actualiza textos, colores, dominios y galería, pero **no toca los productos** que el emprendedor ya editó en su panel. Opciones: `--reset-productos` y `--reset-clave`.

Otras herramientas:
```bash
php tools/cambiar-clave.php nombre-del-negocio "NuevaClave2026!"
php tools/cambiar-clave.php --listar        # los 45 sitios con dominios y productos
```

---

## 6. Qué puede hacer el emprendedor en su panel (`sudominio.com/admin`)

- Iniciar sesión con correo o usuario y contraseña.
- Ver sus productos.
- Agregar productos (máximo 10), editarlos y eliminarlos.
- Cambiar nombre, precio (vacío = "Consultar precio"), descripción corta e imagen.
- Mostrar u ocultar un producto sin borrarlo.
- Cerrar sesión.

Nada más, a propósito: no hay pedidos, pagos, inventario, estadísticas ni múltiples usuarios.

---

## 7. Seguridad incluida

- Consultas preparadas con PDO en toda la API (sin inyección SQL).
- Contraseñas con `password_hash` (bcrypt).
- Sesión con cookie `HttpOnly` y `SameSite=Lax`, regenerada al iniciar sesión y con expiración por inactividad.
- Token CSRF en todas las operaciones del panel.
- Bloqueo tras 5 intentos fallidos durante 15 minutos (por sitio e IP).
- Imágenes: se verifica el tipo real (JPG/PNG/WEBP), máximo 2 MB. Se vuelven a codificar con GD, se redimensionan a 1400 px y se corrige su orientación.
- `uploads/` no ejecuta scripts. `core/` y `tools/` no son accesibles desde el navegador.

---

## 8. Personalizar la plantilla para todos

- **Colores y fuentes:** vienen de la ficha. Todo el CSS se deriva de `--c-primary`, `--c-secondary` y `--c-accent` (`frontend/src/styles/main.css`).
- **Íconos de beneficios:** `truck`, `handshake`, `shield`, `star`, `leaf`, `heart`, `award`, `clock`, `map-pin`, `package`… (ver `components/Icon.jsx`).
- **Redes sociales admitidas:** facebook, instagram, tiktok, youtube, x, linkedin, web.
- **"Productos" o "Servicios":** campo `etiqueta_productos` de la ficha.
- **Límites:** `max_products` y `max_image_bytes` en `config.php`.
