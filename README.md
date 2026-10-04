# Ruteo Bogotá

PWA de rutas con varias paradas por Bogotá. Funciona en iPhone, iPad, Android, PC y Mac,
y queda lista para empaquetarse después con **Capacitor + Xcode**.

> No incluye una IPA ni una app firmada: eso solo se genera en tu Mac con Xcode (ver más abajo).

## Estructura

```
index.html              app completa (HTML + CSS + JS)
manifest.webmanifest    nombre "Ruteo Bogotá", iconos, display: standalone
service-worker.js       guarda el "cascarón" para abrir rápido / sin conexión
icons/                  apple-touch-icon, favicon, icon-192/512, maskable
capacitor.config.json   configuración para Capacitor (webDir: www)
package.json            scripts y dependencias de Capacitor
scripts/build-www.mjs   copia la PWA a ./www (lo que empaqueta Capacitor)
```

El mapa, las rutas (OSRM), las búsquedas y los tiles **siempre necesitan internet**;
el service worker solo guarda la app, las librerías del mapa y la tipografía.

## 1) Publicar la PWA (necesita HTTPS)

El GPS y el service worker solo funcionan en `https://` (o `localhost`).
Sube la carpeta tal cual a cualquier hosting estático con HTTPS:
GitHub Pages, Netlify, Cloudflare Pages, Vercel, etc.

Prueba local en tu computador:

```bash
npm run serve        # http://localhost:5173
```

Para probar en el iPhone necesitas una URL https (el hosting o un túnel); `http://IP-local` no activa el GPS.

## 2) Instalar en iPhone (Safari)

1. Abre la URL https en **Safari**.
2. Toca **Compartir** → **Añadir a pantalla de inicio** → *Añadir*.
3. Ábrela desde el icono: se ve a pantalla completa, sin barra de Safari.

En Android/Chrome: menú ⋮ → **Instalar app**.

Si actualizas los archivos y no ves cambios, cierra la app por completo y ábrela de nuevo
(el service worker usa la red primero y refresca solo). Si cambias archivos de `icons/` o la lista del `SHELL`,
sube el número de `VERSION` en `service-worker.js`.

## 3) Capacitor + Xcode (cuando quieras la app nativa)

Requisitos (verificados en la documentación de Capacitor 8): Node 22+, Xcode 26+, macOS, cuenta de Apple
(gratuita para probar en tu iPhone; de pago para App Store).

```bash
npm install
npm run cap:add:ios      # genera la carpeta ios/ (una sola vez)
npm run cap:sync         # cada vez que cambies index.html
npm run cap:open:ios     # abre Xcode
```

Antes de compilar en Xcode:

- **Info.plist**: agrega `NSLocationWhenInUseUsageDescription` con un texto como
  "Ruteo Bogotá usa tu ubicación para navegar tus paradas." (sin esto iOS no pedirá el permiso de GPS).
- **Signing & Capabilities**: elige tu *Team* y cambia el *Bundle Identifier* (`co.ruteo.bogota` es solo un
  ejemplo en `capacitor.config.json` → `appId`; debe ser único).
- Para segundo plano (navegar con la pantalla bloqueada) harían falta el plugin de geolocalización de Capacitor
  y la capacidad *Background Modes → Location updates*. La versión actual no lo incluye.

Puntos por verificar en el primer build nativo (no pude probarlos aquí): que el GPS funcione dentro del
WebView (si `navigator.geolocation` no responde, la solución habitual es `@capacitor/geolocation`),
y que la comprobación `isSecureContext` de la app acepte el esquema `capacitor://`.

## Notas de la versión móvil

- **Teléfono**: mapa a pantalla casi completa + bottom sheet con tres posiciones (contraído / medio / completo).
  Se arrastra desde el asa o desde la barra de "siguiente parada"; un toque la expande o contrae.
- **Modo conductor** (botón 🚗 *Conductor*, también durante la ruta): oculta los controles del mapa y deja
  maniobra, siguiente parada, distancia, ETA, progreso y Finalizar con botones grandes.
- **Recentrar**: si mueves el mapa durante la ruta se deja de seguir tu posición y aparece el botón flotante;
  al pulsarlo vuelve a seguirte.
- **Tablet / PC**: barra lateral con la lista y el mapa a la derecha.

## Funciones nuevas (v5)

- **Paradas**: nombre, nota, teléfono, prioridad, tiempo en la parada (✎), completar, saltar (queda en *Omitidas*), ver en mapa, navegar, eliminar con **Deshacer**.
- **Arrastrar** el asa ⋮⋮ (ratón y táctil). Con el filtro en "Todas".
- **Favoritos**, **Rutas guardadas** (abrir, editar, duplicar, eliminar, iniciar; con fecha/hora opcional) e **Historial** (fecha, paradas, km, tiempo). Todo en localStorage de este dispositivo.
- **Resumen** que se actualiza solo (paradas, km, tiempo, completadas, restantes, ETA) y **filtros**.
- **Compartir ruta**: menú nativo (Web Share) o copia al portapapeles. WhatsApp sigue disponible.
- **Indicaciones por voz** (Web Speech): solo lee las maniobras que entrega OSRM.
- **Atajos de PC**: M ubicación · R recalcular · O optimizar · N navegar · / buscar · Esc cerrar.
- **Recuperar ruta** al reabrir: pide GPS y recalcula con las pendientes.
- **Recalcular al cambiar el orden** (se puede apagar en Opciones de ruta).
- Limitación del navegador: las rutas programadas no envían alarmas con la app cerrada; avisan al abrir la app ese día.

## Notas técnicas (revisión)

- **GPS**: solo se mantiene un `watchPosition` mientras hay una ruta en navegación activa (y sin pausar). Al pausar, finalizar, ocultar/cerrar la página o si se deniega el permiso, se detiene y se libera el *wake lock*. Los botones «Mi ubicación» y ◎ hacen una lectura puntual; el botón de MapLibre ya no deja un seguimiento continuo.
- **Privacidad**: la posición GPS del momento no se guarda en `localStorage` (ni como partida de la sesión ni en rutas guardadas); el historial solo guarda fecha, paradas, km y minutos. La clave de Google (opcional) queda en este navegador: restríngela por dominio en Google Cloud.
- **Límites de iPhone/PWA** (no se simulan): sin GPS ni voz con la pantalla bloqueada o la app en segundo plano; la voz solo suena tras un gesto del usuario (se «prepara» al tocar Iniciar); el *wake lock* depende de la versión de iOS. Para segundo plano real hace falta la versión nativa (Capacitor + `@capacitor/geolocation` + Background Modes).
- **HTTPS**: GPS, service worker, *wake lock*, portapapeles y Web Share exigen `https://` (o `localhost`). Todas las APIs externas usadas (OSRM, Nominatim, Photon, Overpass, Catastro, OpenFreeMap, Esri, Open-Meteo) se consumen por HTTPS.
- **Servicios públicos gratuitos**: OSRM demo, Nominatim, Photon y Overpass tienen políticas de uso razonable; para uso intensivo conviene un OSRM propio.

## Pulido final (v7)

- **Planificación vs. navegación**: en planificación el panel ordena buscar → paradas → acciones → ajustes; en navegación solo quedan mapa, maniobra, siguiente parada y tres botones (Llegué · Saltar · Finalizar). Pausar, Anterior, Recalcular, Ver ruta, Google Maps y Voz están en la hoja ampliada.
- **Automático**: la ruta se calcula sola al tener 2 puntos (se desactiva en Opciones de ruta › «Recalcular la ruta automáticamente»); el botón principal cambia a CONTINUAR RUTA / RUTA COMPLETADA y se desactiva cuando no hay nada que iniciar.
- **Sin diálogos nativos**: confirmar/pedir texto usa un diálogo propio; «Borrar todo» ahora tiene Deshacer.
- **Estados**: spinner en Buscar / Mi ubicación / Optimizar / Iniciar, indicador de recálculo, «EN PAUSA», aviso «Sin conexión», pantalla de arranque y error de carga con Reintentar.
- **Microinteracciones** (respetan `prefers-reduced-motion`): pin que cae al agregar, pulso al completar, destello en la tarjeta completada, cambio suave de la siguiente parada, pulso de GPS conectado, sacudida si se pierde, transición suave de tema, vibración corta en Android.
