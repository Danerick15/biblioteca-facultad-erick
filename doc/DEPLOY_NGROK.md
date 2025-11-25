# Despliegue rápido (Frontend + Backend) usando Ngrok en una VM Ubuntu

Este documento explica, paso a paso, cómo exponer tanto el frontend como el backend de este proyecto (`biblioteca-facultad`) usando `ngrok`, siguiendo el flujo que compartiste. Está pensado para pruebas y demo — no para producción en largo plazo.

Rutas del proyecto (root del repo):
- Backend: `backend/NeoLibro.WebAPI`
- Frontend: `frontend/frontend`

Resumen del flujo (alto nivel)
0. Ajustar la configuración del frontend para producción (usar rutas relativas a `/api`).
1. Generar la build de frontend en modo producción.
2. Iniciar el backend (Kestrel / `dotnet run`).
3. Servir la carpeta `dist` del frontend con un servidor estático que haga proxy a `http://localhost:5000`.
4. Lanzar `ngrok http` apuntando al puerto del servidor estático (ej. 4200) para obtener la URL pública.

IMPORTANTE: ngrok expone tu aplicación públicamente. Úsalo sólo para pruebas/demos.

---

0) Ajustar la configuración del frontend (SOLO SI TU FRONT NO USA /api)

**Estado actual en tu proyecto:**

✅ Todos los módulos (`auth.ts`, `reservas.ts`, `recomendaciones.ts`, `usuarios.ts`, etc.) ya usan rutas relativas a `/api` con `axios.defaults.baseURL = "/api"`.
No se requiere ajuste adicional para ngrok.

Reemplaza la primera línea:
```ts
// ANTES (hardcodeado a localhost:5180)
const API_BASE_URL = 'http://localhost:5180/api';

// DESPUÉS (usa baseURL configurado en auth.ts)
// axios.defaults.baseURL ya está configurado en auth.ts como '/api'
const API_BASE_URL = '';  // o simplemente ajusta cada llamada a usar rutas relativas
```

Mejor aún, cambia todas las llamadas en `usuarios.ts` de:
```ts
axios.get(`${API_BASE_URL}/Usuarios`)  // ❌ usa $API_BASE_URL
```
a:
```ts
axios.get(`/Usuarios`)  // ✅ usa baseURL global
```

Esto permitirá que axios respete `axios.defaults.baseURL = "/api"` definido en `auth.ts`.

**RESUMEN:**

Todo el frontend ya usa rutas relativas a `/api` y está listo para funcionar con ngrok, sin ajustes adicionales.

1) Reconstruir el frontend en modo producción

Desde la VM (en Bash):

```bash
cd /ruta/al/proyecto/frontend/frontend
npm install    # si no está instalado
# build para producción (Vite/React). Ajusta según tu package.json
npm run build
# Resultado: carpeta `dist/` (ej: frontend/frontend/dist)
```

2) Terminal 1 — Arranca tu backend

Puedes ejecutar el backend en modo desarrollo (dotnet run) escuchando en `http://0.0.0.0:5000` o en una carpeta publicada.

Modo rápido (dev):

```bash
cd /ruta/al/proyecto/backend/NeoLibro.WebAPI
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://0.0.0.0:5000
# Opcional: si usas variables para la DB o CORS
export ConnectionStrings__cnnNeoLibroDB="Server=...;Database=...;User Id=...;Password=...;"
dotnet run --urls "http://0.0.0.0:5000"
# Deberías ver: "Now listening on: http://0.0.0.0:5000"
```

Modo usando publish (más estable):

```bash
cd /ruta/al/proyecto/backend/NeoLibro.WebAPI
dotnet publish -c Release -o /tmp/neolibro_publish
export ASPNETCORE_ENVIRONMENT=Production
export ASPNETCORE_URLS=http://0.0.0.0:5000
cd /tmp/neolibro_publish
dotnet NeoLibro.WebAPI.dll
```

3) Terminal 2 — Sirve el frontend con proxy

La forma más rápida es usar `http-server` (npm) y su opción `-P` para el proxy.

Instalación si no la tienes:

```bash
sudo npm i -g http-server
```

Sirve el `dist` con proxy hacia `http://localhost:5000`:

```bash
cd /ruta/al/proyecto/frontend/frontend/dist
# puerto local 4200 (ejemplo), proxy a 5000 (backend)
npx http-server . -p 4200 --cors -P http://localhost:5000 --fallback index.html

# Verás logs del servidor estático. Ahora todas las llamadas a /api/* serán proxeadas a http://localhost:5000/api/*
```

Notas:
- `--fallback index.html` asegura que SPA routing funcione.
- `-P http://localhost:5000` hace que las llamadas a rutas no encontradas en el servidor estático se reenvíen al backend (proxy); además, muchas versiones de `http-server` usan `http-proxy` bajo el capó y respetan rutas `/api`.

4) Terminal 3 — Exponer con ngrok

Instala y autentica ngrok (si no lo has hecho):

```bash
wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip
sudo mv ngrok /usr/local/bin/
ngrok authtoken <TU_NGROK_AUTHTOKEN>
```

Exponer el servidor estático (puerto 4200):

```bash
ngrok http 4200
```

Ngrok te mostrará una URL pública (ej: `https://abcdef12345.ngrok-free.app`). Abre esa URL en el navegador: verás el frontend. Las peticiones a `/api` serán proxeadas al backend por el `http-server` local.

Ejemplo de uso final:
- Abrir `https://abcdef12345.ngrok-free.app/` -> frontend
- Abrir `https://abcdef12345.ngrok-free.app/api/health` -> proxied al backend en `http://localhost:5000/api/health`

------

Consejos extra y solución de problemas

- CORS
  - Con este enfoque el frontend y el servidor estático comparten el mismo host (ngrok), por lo que las llamadas a `/api` no rompen CORS porque el proxy hace las peticiones desde el mismo origen. Si en lugar de proxyear sirves el frontend apuntando directamente a un backend público distinto, deberás añadir el origen público a `Frontend:Origins` en el backend.

- Cookies y autenticación
  - Si tu app usa cookies (auth por cookie) y estás haciendo cross-site (ej. frontend en un dominio, backend en otro), debes usar `SameSite=None` y `Secure=true`. En `Program.cs` del backend ya añadimos configuración para leer `Cookie:SameSite`. En producción con ngrok (https) establece `Cookie__SameSite=None`.

- Variables de entorno en Linux
  - Recuerda que para .NET Core las variables con `:` en JSON se pasan con `__` en variables de entorno. Ejemplo: `Frontend:Origins` -> `FRONTEND__Origins`.

- Logs y debugging
  - Revisa `journalctl` si corres como service, o la salida de `dotnet run` si lo ejecutas manualmente.

- Exponer sólo backend o sólo frontend
  - Si quieres exponer sólo el backend: `ngrok http 5000` (y configura CORS para la URL de ngrok si el frontend está en otro origen).
  - Si quieres exponer sólo el frontend (y usar backend localmente), `ngrok http 4200` pero asegúrate que las peticiones a la API apunten a la URL correcta.

Automatizar (script rápido)

Puedes usar este script de ejemplo para desarrollo en la VM (ajusta rutas y variables):

```bash
#!/usr/bin/env bash
set -e

BASE=/ruta/al/proyecto
FRONT=$BASE/frontend/frontend
BACK=$BASE/backend/NeoLibro.WebAPI

# Build frontend
cd $FRONT
npm install
npm run build

# Start backend
cd $BACK
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS=http://0.0.0.0:5000
dotnet run --urls "http://0.0.0.0:5000" &
BACK_PID=$!

# Serve frontend dist with proxy
cd $FRONT/dist
npx http-server . -p 4200 --cors -P http://localhost:5000 --fallback index.html &

echo "Backend PID: $BACK_PID"
echo "Run: ngrok http 4200"

wait
```

Conclusión

Siguiendo estos pasos tendrás el frontend y backend expuestos desde una única URL pública provista por ngrok, lo cual facilita demos y pruebas. Si quieres que genere un `deploy-ngrok.sh` listo para copiar en la VM (con placeholders para la DB y el token de ngrok) dímelo y lo añado.
