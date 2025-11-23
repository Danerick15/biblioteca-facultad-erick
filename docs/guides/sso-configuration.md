# 🔐 Configuración de SSO con Google

Guía para configurar la autenticación Single Sign-On (SSO) con Google OAuth2.

---

## 📋 Prerrequisitos

- Cuenta de Google con acceso a Google Cloud Console
- Dominio de email institucional configurado (ej: `@unmsm.edu.pe`)

---

## 🔧 Pasos de Configuración

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**

### 2. Configurar OAuth Consent Screen

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External** (para desarrollo) o **Internal** (para organización)
3. Completa la información requerida:
   - App name: `Biblioteca FISI`
   - User support email: Tu email
   - Developer contact: Tu email

### 3. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Click en **Create Credentials** → **OAuth client ID**
3. Selecciona **Web application**
4. Configura:
   - **Name:** Biblioteca FISI Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (desarrollo)
     - `https://tu-dominio.com` (producción)
   - **Authorized redirect URIs:**
     - `http://localhost:5173/auth/callback` (desarrollo)
     - `https://tu-dominio.com/auth/callback` (producción)

5. Guarda el **Client ID** y **Client Secret**

### 4. Configurar Backend

Edita `backend/NeoLibro.WebAPI/appsettings.json`:

```json
{
  "GoogleOAuth": {
    "ClientId": "TU_CLIENT_ID_AQUI",
    "ClientSecret": "TU_CLIENT_SECRET_AQUI"
  }
}
```

### 5. Configurar Frontend

Edita `frontend/frontend/.env` o crea `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI
```

### 6. Verificar Dominio Institucional

El backend valida que los emails terminen en `@unmsm.edu.pe`. Para cambiar esto, edita:

`backend/NeoLibro.WebAPI/Controllers/AuthController.cs`

Busca la línea:
```csharp
if (!payload.Email.EndsWith("@unmsm.edu.pe"))
```

Y modifica según tu dominio.

---

## ✅ Verificación

1. Inicia el backend y frontend
2. En el frontend, click en "Iniciar sesión con Google"
3. Deberías ser redirigido a Google para autenticación
4. Después de autenticarte, serás redirigido de vuelta a la aplicación

---

## 🔒 Seguridad

- ✅ Solo emails institucionales pueden autenticarse
- ✅ Los usuarios se crean automáticamente si no existen
- ✅ Se asigna el rol "Estudiante" por defecto
- ✅ Los tokens se validan en el servidor

---

## 🆘 Troubleshooting

### Error: "redirect_uri_mismatch"

- Verifica que las URIs en Google Console coincidan exactamente
- Incluye el protocolo (`http://` o `https://`)
- Verifica que no haya espacios o caracteres extra

### Error: "invalid_client"

- Verifica que el Client ID y Secret sean correctos
- Asegúrate de que el proyecto tenga la API habilitada

### Error: "Email no institucional"

- Verifica la validación en `AuthController.cs`
- Asegúrate de usar un email del dominio configurado

---

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

