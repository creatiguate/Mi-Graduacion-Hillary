# Invitación digital de graduación — Hillary (2026)

Sitio **mobile-first** en HTML, CSS y JavaScript, listo para publicarse como proyecto estático en **GitHub Pages**. Tema azul rey, marfil y dorado; las tres fotografías de la graduada, tres fotos del lugar, un video de apertura a pantalla completa, la canción proporcionada, mariposas animadas, cuenta regresiva, calendario, mapa, formulario de confirmación por WhatsApp y galería de Polaroids con cámara. Interfaz en español.

## Novedades de la versión CreatiGuate lista para publicar

- **Arranque confiable en móvil:** al tocar «Abrir mi invitación» comienza el video a pantalla completa. Si el video falla, la pantalla se desbloquea automáticamente; además hay un botón «Omitir animación». Ya no se espera indefinidamente a que se active el evento `canplay`.
- **Mariposas volando de verdad:** las dos mariposas GIF existentes cruzan la pantalla siguiendo rutas suaves, alternadas e intermitentes. Los teléfonos limitan las mariposas simultáneas para proteger el rendimiento; se desactivan con la preferencia de accesibilidad de movimiento reducido.
- **Animaciones de aparición:** el texto y fotografías aparecen al desplazarse, pero son visibles por defecto si JavaScript no logra ejecutarse.
- **Sin dependencia de SweetAlert/CDN externa:** el aviso de estado usa un componente local, evitando que una biblioteca bloqueada afecte la experiencia.
- **Firma de marca:** pie de página con el texto «Diseñada por» y el logotipo de CreatiGuate original aportado.

## Lo esencial de esta edición

- **Pantalla de carga de video:** el archivo `assets/video/apertura.mp4` **ocupa el 100 % de la pantalla**, sin bordes ni reproductor integrado. Como el video original es horizontal pero su animación está centrada, en teléfono `object-fit: cover` recorta los laterales y conserva el centro. Dura aproximadamente **7 segundos**, y existe la opción «Omitir animación».
- **Música:** el audio suministrado está en `assets/audio/un-viaje-largo.mp3`. El visitante pulsa **«Abrir mi invitación» una vez** para autorizar el audio en iPhone/Android. El sistema reproduce el video a pantalla completa; al terminar (o al omitirlo), revela la invitación y arranca la canción desde el inicio. Algunos navegadores pueden solicitar otro toque en el control de música.
- **Confirmar asistencia:** en vez de compartir el enlace, el formulario pide nombre, respuesta sí/no, número de asistentes (si asiste) y mensaje opcional. Genera un texto listo para enviar a **+502 3340 2375** mediante WhatsApp. **El invitado debe pulsar «Enviar» dentro de WhatsApp**. El formulario no guarda respuestas ni recopila datos en un servidor.
- **Periódico completo:** no se recorta, muestra el contenido íntegro y ofrece un enlace para abrir la imagen en grande.
- **Lugar:** incluye las tres fotos del Hotel El Campo. La imagen de decoración que se proporcionó se usa solo como referencia de tonos, no como fotografía real del recinto. Se advierte claramente que **la piscina no estará habilitada**.
- **Galería compartida:** requiere configurar Supabase como se describe abajo. No usa Cloudflare Turnstile. Sin configurar, funciona únicamente como demostración local.

**Derechos de autor:** el MP3 es la grabación aportada para este encargo; tener el archivo no implica autorización para distribuirlo públicamente. Confirma que tienes los derechos o licencia correspondientes **antes de activar GitHub Pages con el MP3 publicado**. En caso contrario, retíralo de `assets/audio/` y deja `musicUrl: ""` en `config.js`.


**Datos de la invitación:** Hillary Verally Pérez González · sábado 28 de noviembre de 2026 · 6:00 p. m. (Guatemala) · Hotel El Campo, Flores Costa Cuca, Quetzaltenango.

## 1. Publicar en GitHub Pages (sin instalar nada)

1. En GitHub, crea un repositorio, por ejemplo, `invitacion-hillary`.
2. Sube **todo el contenido** de esta carpeta, incluyendo `index.html`, `app.js`, `config.js`, `styles.css`, `assets/` y `supabase/`. **No subas solamente el ZIP** dentro del repositorio: descomprímelo primero.
3. En **Settings → Pages → Build and deployment → Source** elige **Deploy from a branch**; selecciona la rama `main`, carpeta `/(root)` y guarda.
4. El enlace suele quedar como `https://TU-USUARIO.github.io/invitacion-hillary/`. Comprueba el enlace que GitHub te indique, ya que puede variar.
5. Para una vista previa en computadora usa un servidor local, por ejemplo `python -m http.server 5500` y abre `http://localhost:5500`. Abrir `index.html` directamente como archivo puede deshabilitar cámara y almacenamiento local.

**IMPORTANTE:** La página y las **fotografías incluidas en el código del repositorio** serán accesibles para cualquier persona con acceso a ese repositorio o a la web publicada. Noindex ayuda a reducir indexación, **no** lo convierte en privado.

## 2. Galería: dos modos

- **Sin configuración (por defecto):** es una demostración funcional. Los invitados pueden probar cámara, elegir fotografía, escribir su nombre y crear Polaroids. Estas fotos se guardan **solo en el navegador/dispositivo** con IndexedDB, nunca se comparten. El sitio muestra una advertencia explicando esta limitación.
- **Con Supabase:** las fotos se envían a una API con límite de cuatro intentos por hora y moderación manual. El organizador aprueba cada foto desde el panel de Supabase; **solo las aprobadas** aparecen en las galerías de todos los invitados. No se usa captcha, por lo que la protección contra spam es más limitada. El servicio Supabase debe configurarse por su titular y sus límites/planes pueden cambiar.

GitHub Pages es hosting estático y **no** ofrece por sí mismo una base de datos compartida ni acepta archivos subidos de forma persistente por otros visitantes.

### 2A. Preparar Supabase

1. Crea un proyecto nuevo en [Supabase](https://supabase.com/), inicia sesión y conserva su `project ref`.
2. Abre **SQL Editor** del proyecto, pega el contenido completo de `supabase/migrations/20261106000000_graduation_gallery.sql` y ejecútalo **una sola vez**; alternativamente aplica la migración con Supabase CLI. Esto crea:
   - tabla `graduation_photos` con estados `pending`, `approved`, `rejected`;
   - tabla y función para limitar a **50 intentos por hora** por IP hash;
   - bucket `graduation-photos` **privado**, con límite de 5 MB/JPEG;
   - restricciones de acceso RLS (ninguna lectura/escritura pública directa).
3. Asegúrate de **NO** activar `Public bucket` y de no crear políticas públicas de acceso a las fotos o tablas.

### 2B. Desplegar la función de Supabase

Necesitas [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (instalado siguiendo su guía oficial) y acceso al proyecto.

Desde la **carpeta raíz del proyecto**:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
```

Configura las variables secretas **en Supabase, nunca en GitHub** (el siguiente ejemplo usa marcadores que tienes que reemplazar):

```bash
supabase secrets set \
  ALLOWED_ORIGINS="https://TU-USUARIO.github.io" \
  IP_HASH_SALT="UNA_CADENA_ALEATORIA_LARGA_DE_AL_MENOS_32_CARACTERES"

supabase functions deploy graduation-gallery --no-verify-jwt
```

> `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta normalmente el entorno hospedado de Edge Functions de Supabase. La función usa la clave de servicio **solo del lado del servidor**. Si tu entorno difiere, revísalo en la documentación oficial. No incluyas jamás la service role key en `config.js`, HTML, GitHub Actions ni archivos públicos.

En `ALLOWED_ORIGINS` pueden escribirse varios orígenes separados por comas, por ejemplo `https://TU-USUARIO.github.io,https://invitacion.tudominio.com`; **no incluyas rutas**. Para pruebas locales puedes añadir `http://localhost:5500`.

Si alguna vez modificas la función, vuelve a ejecutar el deploy. Para acceder a la API utiliza:

`https://TU_PROJECT_REF.supabase.co/functions/v1/graduation-gallery`

### 2D. Activar en GitHub Pages

Edita `config.js` de la web:

```js
window.INVITATION_CONFIG = Object.freeze({
  galleryEndpoint: "https://TU_PROJECT_REF.supabase.co/functions/v1/graduation-gallery",
  musicUrl: ""
});
```

Vuelve a subir el archivo al repositorio. La galería conectada se habilitará automáticamente. **`SUPABASE_SERVICE_ROLE_KEY` nunca debe aparecer en este archivo.**

### 2E. Aprobar fotografías

1. En Supabase entra a **Table Editor → `graduation_photos`**.
2. Localiza las filas con `status = pending` y revisa las fotos en **Storage → `graduation-photos`**. Las rutas de cada foto aparecen en `storage_path`.
3. Cambia el campo `status` a `approved` para mostrar esa foto en la galería. Si no la deseas, cambia a `rejected`.
4. Si una foto debe eliminarse, **elimina también el archivo del bucket privado y su fila** en la tabla. Ten en cuenta que una URL firmada entregada antes de borrarla puede seguir siendo válida hasta que venza (una hora), salvo que se borre el objeto.
5. Pulsa **Actualizar galería** desde la invitación para ver las aprobadas; las nuevas fotos no aparecen automáticamente hasta aprobarlas y actualizar.

**Moderación importante:** todas las fotos enviadas quedan en estado `pending`, nunca públicas por defecto. Puedes desactivar los envíos al terminar el evento dejando la función inaccesible o quitando el origen permitido en la configuración del servidor. Se recomienda limpiar fotos y registros cuando ya no sean necesarios.

## 3. Música de la invitación

Se incluyó el archivo MP3 que proporcionaste, y `config.js` lo apunta directamente. Publicar el repositorio puede exponer o distribuir el audio: comprueba que tienes permiso o licencia para hacerlo. Para reemplazarlo por una grabación autorizada, guarda el MP3 en `assets/audio/` y modifica `musicUrl` en `config.js`:

```js
musicUrl: "./assets/audio/mi-audio-autorizado.mp3"
```

Al abrir la invitación se intentará reproducir; si el navegador lo bloquea, el visitante podrá usar el botón musical flotante. Los navegadores suelen bloquear la reproducción automática con sonido sin una interacción del usuario; ninguna web puede garantizarla.

## 4. Seguridad y privacidad

- **Captura:** la cámara se activa solo cuando el invitado pulsa **Abrir cámara**, solicita permiso del navegador y se apaga al cerrar el cuadro. Funciona en contextos seguros como HTTPS o localhost.
- **Fotos:** el navegador convierte la imagen a JPEG y reduce su tamaño, lo que normalmente elimina metadatos del archivo original. La función también elimina segmentos JPEG de metadatos previos al primer escaneo (EXIF/XMP/COM) y valida encabezados/dimensiones. No permite subir SVG ni scripts.
- **Abuso:** la API limita a 50 intentos por hora según IP hash, pero no usa captcha. Invitados conectados a la misma red comparten este límite. CORS no es autenticación y no detiene bots que contacten directamente la API; modera las fotos antes de publicarlas.
- **Acceso:** CORS con lista de orígenes, almacenamiento privado, URLs firmadas temporales, tabla sin políticas públicas, secretos exclusivamente en servidor y aprobación manual.
- **Contenido:** no insertamos los nombres enviados mediante `innerHTML`; se pintan como texto seguro. Validación de longitud y caracteres tanto en navegador como servidor.
- **Cabeceras:** la página incorpora una política CSP mediante etiqueta meta, no carga JavaScript de bibliotecas arbitrarias y usa `rel="noopener noreferrer"` en enlaces externos. GitHub Pages **no permite definir todas las cabeceras HTTP de seguridad** desde archivos estáticos; para CSP como cabecera HTTP, HSTS, frame-ancestors y otras reglas, usa un proxy/CDN configurable.
- **Fotos de terceros:** solicita consentimiento de las personas retratadas, evita fotos sensibles y no compartas información personal que no deseas mostrar. La casilla de consentimiento avisa que la foto y el nombre se verán por quienes tengan el enlace después de aprobarla. Cualquier invitado con acceso a la URL pública podría ver o guardar fotos aprobadas.
- **Retención:** revisa y borra fotos al terminar el evento. El archivo `.gitignore` ayuda a evitar subir `.env` y secretos por accidente.

Si deseas una invitación totalmente **privada**, necesitarás agregar autenticación e invitar usuarios autorizados; un enlace de GitHub Pages no constituye control de acceso. No existe un método seguro para guardar secretos exclusivamente dentro de una página estática.

## 5. Cambios rápidos

| Necesitas cambiar | Archivo |
|---|---|
| Nombres, textos, fecha, horarios, lugar | `index.html` y fecha en `app.js` |
| Colores, estilo, animaciones | `styles.css` (`--navy`, `--royal`, `--gold`) |
| Fotos de Hillary | `assets/images/*.webp` y referencias en `index.html` |
| Configuración de galería/música | `config.js` |
| Políticas de almacenamiento y base de datos | `supabase/migrations/*.sql` |
| Protección y validación de subidas | `supabase/functions/graduation-gallery/index.ts` |

**Ubicación:** el botón usa una **búsqueda de Google Maps**, no coordenadas exactas. Conviene verificar con la anfitriona cuál es el pin correcto de Hotel El Campo antes de compartir el enlace. **Calendario:** el archivo ICS comienza el 28/11/2026 a las 18:00 de Guatemala; se colocó una duración provisional de 2 horas porque no se proporcionó hora de finalización.

**Vista previa en WhatsApp:** para mejorar la miniatura después de publicar, reemplaza el `content="./assets/images/social-cover.jpg"` del `meta property="og:image"` por la URL absoluta `https://TU-USUARIO.github.io/invitacion-hillary/assets/images/social-cover.jpg`.

---

Diseño: CreatiGuate · Tema privado de graduación 2026. Las fotografías de Hillary pertenecen a sus titulares y no se licencian para reutilización o redistribución.

## 6. Si GitHub Pages no carga en el teléfono

1. Confirma que el repositorio tiene `index.html` **directamente en la raíz publicada** y no dentro de otra carpeta `Hillary-Invitacion-2026/`.
2. En **Settings → Pages**, comprueba que elegiste `main` y `/(root)`. Espera a que GitHub indique que la publicación terminó.
3. Abre el enlace HTTPS publicado (no una ruta local, ni un preview `file://`). En Android y iPhone el sitio requiere HTTPS para usar cámara.
4. Prueba en una pestaña privada o recarga la página desde el navegador para evitar una versión anterior en caché.
5. Si el video no puede reproducirse, pulsa «Omitir animación»: debe entrar sin quedarse bloqueado. El MP3 puede necesitar un toque en el botón flotante.
6. Verifica las rutas de archivos y mayúsculas: GitHub diferencia letras mayúsculas/minúsculas. No renombres `opening.js`, `app.js`, `styles.css` o `assets/` sin corregir el HTML.
7. Abre la consola del navegador de escritorio para buscar respuestas 404 si los archivos no aparecen.

## 7. Reutilización como producto comercial

Para cada cliente crea un repositorio o despliegue independiente. Actualiza los textos, imágenes, fecha de la cuenta regresiva, horario del `.ics`, número de WhatsApp, mapa y vista previa de redes; verifica fotos y permisos de uso antes de publicar. Deja el crédito de CreatiGuate al final. No compartas credenciales ni recursos de Supabase entre eventos sin una separación de datos y controles de acceso específicos.

La invitación estática, la cámara de prueba y el formulario de WhatsApp funcionan sin servidor. La **galería pública multiusuario** no está conectada mientras falten el proyecto Supabase y las credenciales públicas de Turnstile (las claves secretas se configuran en el servidor). Esto debe completarse antes de vender una experiencia que prometa fotos compartidas entre todos.
