# Información que debe entregar cada emprendimiento

| # | Dato | Obligatorio | Formato / recomendación | Campo en `ficha.json` |
|---|------|:-----------:|-------------------------|-----------------------|
| 1 | Nombre del emprendimiento | Sí | Tal como quiere que aparezca | `nombre` |
| 2 | Logo | Sí | PNG con fondo transparente (ideal) o JPG · máx. 2 MB | `logo` |
| 3 | Colores representativos | No | Códigos de color (#1f6b3a) o una foto de referencia. Si no tiene, se eligen con él | `colores` |
| 4 | Frase principal y descripción breve | Sí | 1 frase + 1 o 2 líneas | `inicio.titulo`, `inicio.descripcion` |
| 5 | Imagen principal | Sí | JPG/PNG horizontal, mín. 1600 px de ancho · máx. 2 MB | `inicio.imagen_principal` |
| 6 | Texto "Quiénes somos" | Sí | 1 a 3 párrafos (historia, qué hacen, qué los diferencia) | `quienes_somos.texto` |
| 7 | Imagen del emprendimiento | Sí | Foto del equipo, el local o el proceso · máx. 2 MB | `quienes_somos.imagen` |
| 8 | Misión y visión | No | 1 o 2 líneas cada una | `quienes_somos.mision/vision` |
| 9 | Productos o servicios | Sí | **Máximo 10**: nombre, precio (si aplica), descripción corta (máx. 300 caracteres) | `productos` |
| 10 | Imagen de cada producto | Sí | Una por producto, JPG/PNG, preferiblemente cuadrada u horizontal · máx. 2 MB | `productos[].imagen` |
| 11 | Imágenes para la galería | No | Hasta 3 · JPG/PNG · máx. 2 MB | `galeria` |
| 12 | Número de WhatsApp | Sí | Con indicativo del país: 57 + número (573001234567) | `contacto.whatsapp` |
| 13 | Correo electrónico | Sí | Correo de contacto y para ingresar al panel | `contacto.correo`, `administrador.correo` |
| 14 | Ubicación | No | Dirección y ciudad, y si quiere, enlace de Google Maps | `contacto.direccion/ciudad/mapa_url` |
| 15 | Horario de atención | No | Ej.: "Lunes a sábado · 8:00 a. m. – 6:00 p. m." | `contacto.horario` |
| 16 | Redes sociales | No | Solo las que quiera mostrar (enlace completo) | `redes` |
| 17 | Dominio | Sí | **2 opciones** en orden de preferencia (ej.: minegocio.com / minegocio.co) | `dominios` |

## Consejos para las fotos
- Tómalas con luz natural y el celular en horizontal para la imagen principal.
- Usa fondos limpios en las fotos de productos, con el mismo estilo en todas.
- Si una foto pesa más de 2 MB, redúcela antes de enviarla (por ejemplo con squoosh.app).
- No uses imágenes con marca de agua ni descargadas de internet sin permiso.
