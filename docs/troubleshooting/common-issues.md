# 🔧 Problemas Comunes y Soluciones

Guía de solución de problemas frecuentes del sistema.

---

## 🗄️ Problemas de Base de Datos

### Error: "Cannot open database"

**Solución:**
1. Verifica que SQL Server esté ejecutándose
2. Verifica la cadena de conexión en `appsettings.json`
3. Asegúrate de que la base de datos exista

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BibliotecaFISI;TrustServerCertificate=true;"
  }
}
```

### Error: "Login failed for user"

**Solución:**
- Usa autenticación de Windows si es posible
- O verifica usuario y contraseña en la cadena de conexión

---

## 🔌 Problemas de Conexión Backend-Frontend

### Error: CORS

**Solución:** Verifica la configuración CORS en `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### Error: 404 en API calls

**Solución:**
- Verifica que el backend esté ejecutándose
- Verifica la URL base en el frontend
- Revisa que los endpoints coincidan

---

## 🔐 Problemas de Autenticación

### Error: "Invalid token"

**Solución:**
- Verifica que las cookies estén habilitadas
- Limpia las cookies del navegador
- Verifica la configuración de autenticación

### Error: SSO no funciona

**Solución:**
- Verifica Client ID y Secret en `appsettings.json`
- Verifica las URIs en Google Console
- Revisa la [Guía de SSO](../guides/sso-configuration.md)

---

## 📦 Problemas de Instalación

### Error: "dotnet: command not found"

**Solución:**
- Instala .NET 9.0 SDK
- Verifica que esté en el PATH
- Reinicia la terminal

### Error: "npm: command not found"

**Solución:**
- Instala Node.js 18+
- Verifica que npm esté instalado
- Reinicia la terminal

---

## 🐛 Problemas de Compilación

### Error: "Package restore failed"

**Solución:**
```bash
dotnet clean
dotnet restore
dotnet build
```

### Error: "TypeScript errors"

**Solución:**
```bash
cd frontend/frontend
npm install
npm run build
```

---

## 🔍 Más Ayuda

- [Problemas de Base de Datos](database-issues.md)
- [Documentación Principal](../README.md)
- [Abrir un Issue](https://github.com/G-E-L-O/biblioteca-facultad/issues)

