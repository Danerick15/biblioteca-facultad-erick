# 🔧 Guía de Solución de Problemas - Conexión SQL Server

## 📋 Índice
1. [Problemas Comunes](#problemas-comunes)
2. [Diagnóstico](#diagnóstico)
3. [Soluciones](#soluciones)
4. [Prevención](#prevención)
5. [Referencia Rápida](#referencia-rápida)

---

## 🚨 Problemas Comunes

### Problema 1: Error de Conexión al Backend
**Síntoma:**
```
Microsoft.Data.SqlClient.SqlException: Error relacionado con la red o específico de la instancia 
mientras se establecía una conexión con el servidor SQL Server. 
No se encontró el servidor o éste no estaba accesible.
```

**Causas posibles:**
- ❌ La cadena de conexión no coincide con la instancia de SQL Server instalada
- ❌ SQL Server Express no está corriendo
- ❌ SQL Server Browser no está habilitado
- ❌ La cadena de conexión tiene formato incorrecto
- ❌ Firewall bloqueando conexiones

### Problema 2: "No se puede abrir una conexión con SQL Server"
**Síntoma:**
```
Error: 40 - No se pudo abrir una conexión con SQL Server
El sistema no puede encontrar el archivo especificado
```

**Causas posibles:**
- ❌ Instancia de SQL Server incorrecta en la cadena de conexión
- ❌ SQL Server Browser deshabilitado (necesario para conexiones por nombre de instancia)

---

## 🔍 Diagnóstico

### Paso 1: Verificar Servicios de SQL Server

#### Opción A: Usando PowerShell (Recomendado)
```powershell
# Ver todos los servicios de SQL Server
Get-Service | Where-Object { $_.Name -like "*SQL*" } | Format-Table -AutoSize

# Verificar servicios específicos
Get-Service "MSSQL*SQLEXPRESS*"  # SQL Server Express
Get-Service "SQLBrowser"          # SQL Server Browser
```

#### Opción B: Usando la Interfaz Gráfica
1. Presiona `Win + R`
2. Escribe: `services.msc`
3. Busca estos servicios:
   - **SQL Server (SQLEXPRESS)** - Debe estar "Running"
   - **SQL Server Browser** - Debe estar "Running" ⚠️ **IMPORTANTE**

### Paso 2: Verificar Instancia de SQL Server

#### Usando SQL Server Management Studio (SSMS)
1. Abre SSMS
2. En "Server name", intenta conectarte con:
   - `localhost\SQLEXPRESS`
   - `.\SQLEXPRESS`
   - `localhost`
3. La que funcione es la correcta para tu cadena de conexión

#### Usando PowerShell
```powershell
# Listar instancias de SQL Server
Get-Service | Where-Object { $_.DisplayName -like "*SQL Server*" } | Select-Object DisplayName, Name, Status
```

### Paso 3: Probar Conexión

#### Usando el Script de Verificación
```powershell
cd .
.\diagnostico_sql.ps1
```

Este script probará automáticamente diferentes cadenas de conexión y te dirá cuál funciona.

#### Manualmente con SQL Server
1. Abre SQL Server Management Studio
2. Intenta conectarte con diferentes formatos:
   - `localhost\SQLEXPRESS`
   - `.\SQLEXPRESS`
   - `TU_PC\SQLEXPRESS`
   - `localhost` (si es instancia por defecto)

---

## ✅ Soluciones

### Solución 1: Corregir Cadena de Conexión

#### Archivo: `backend/NeoLibro.WebAPI/appsettings.json`

**Para SQL Server Express (más común):**
```json
{
  "ConnectionStrings": {
    "cnnNeoLibroDB": "Server=.\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
  }
}
```

**Alternativas si la anterior no funciona:**

1. **Con localhost:**
```json
"cnnNeoLibroDB": "Server=localhost\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
```

2. **Con nombre de PC:**
```json
"cnnNeoLibroDB": "Server=TU_PC\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
```

3. **Sin instancia (si es SQL Server por defecto):**
```json
"cnnNeoLibroDB": "Server=localhost;Database=BibliotecaFISI;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
```

4. **Con puerto específico:**
```json
"cnnNeoLibroDB": "Server=localhost,1433;Database=BibliotecaFISI;Trusted_Connection=True;Encrypt=False;TrustServerCertificate=True;Connection Timeout=30;"
```

#### ⚠️ IMPORTANTE: Escapar las Barras Invertidas
En JSON, las barras invertidas deben estar duplicadas:
- ✅ Correcto: `Server=.\\SQLEXPRESS`
- ❌ Incorrecto: `Server=.\SQLEXPRESS`

### Solución 2: Iniciar Servicios de SQL Server

#### Opción A: PowerShell (Como Administrador)
```powershell
# Iniciar SQL Server Express
Start-Service "MSSQL$SQLEXPRESS"

# Iniciar SQL Server Browser (IMPORTANTE para conexiones por nombre de instancia)
Start-Service SQLBrowser

# Configurar SQL Browser para iniciar automáticamente
Set-Service SQLBrowser -StartupType Automatic
```

#### Opción B: Interfaz Gráfica
1. Abre `services.msc`
2. Busca "SQL Server (SQLEXPRESS)"
3. Click derecho → "Start"
4. Click derecho → "Properties" → "Startup type" → "Automatic"
5. Repite para "SQL Server Browser"

### Solución 3: Habilitar SQL Server Browser

**¿Por qué es importante?**
SQL Server Browser permite que las aplicaciones se conecten usando el nombre de la instancia (como `SQLEXPRESS`) en lugar del puerto.

**Pasos:**
1. Abre "SQL Server Configuration Manager"
2. Expande "SQL Server Services"
3. Busca "SQL Server Browser"
4. Click derecho → "Properties"
5. En "Service" tab:
   - "Start Mode" → "Automatic"
6. Click derecho → "Start"

### Solución 4: Verificar Firewall

Si usas Windows Firewall, asegúrate de que SQL Server pueda aceptar conexiones:

```powershell
# Permitir SQL Server a través del firewall (como administrador)
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
New-NetFirewallRule -DisplayName "SQL Browser" -Direction Inbound -Protocol UDP -LocalPort 1434 -Action Allow
```

### Solución 5: Verificar Autenticación de Windows

Asegúrate de que:
1. Estás usando `Trusted_Connection=True` (autenticación de Windows)
2. Tu cuenta de Windows tiene permisos en SQL Server
3. Si no tienes permisos, agrega tu usuario:
   ```sql
   -- En SSMS, ejecuta como administrador:
   CREATE LOGIN [DOMINIO\TuUsuario] FROM WINDOWS;
   ALTER SERVER ROLE sysadmin ADD MEMBER [DOMINIO\TuUsuario];
   ```

---

## 🔄 Si el Problema Vuelve a Ocurrir

### Checklist de Verificación Rápida

1. ✅ **¿Está SQL Server corriendo?**
   ```powershell
   Get-Service "MSSQL*SQLEXPRESS*" | Select-Object Status
   ```
   - Si está "Stopped" → Iniciar servicio

2. ✅ **¿Está SQL Server Browser corriendo?**
   ```powershell
   Get-Service SQLBrowser | Select-Object Status
   ```
   - Si está "Stopped" → Iniciar servicio

3. ✅ **¿La cadena de conexión es correcta?**
   - Verificar `backend/NeoLibro.WebAPI/appsettings.json`
   - Comparar con la instancia que funciona en SSMS

4. ✅ **¿El backend se reinició?**
   - Después de cambiar `appsettings.json`, **siempre reiniciar el backend**

5. ✅ **¿La base de datos existe?**
   ```sql
   -- En SSMS:
   SELECT name FROM sys.databases WHERE name = 'BibliotecaFISI';
   ```

### Script de Diagnóstico Automático

Ejecuta este script cuando tengas problemas:

```powershell
# El script diagnostico_sql.ps1 está en la raíz del proyecto
.\diagnostico_sql.ps1
```

---

## 📝 Prevención

### Configuración Inicial Recomendada

1. **Configurar SQL Server Browser para iniciar automáticamente:**
   ```powershell
   Set-Service SQLBrowser -StartupType Automatic
   Start-Service SQLBrowser
   ```

2. **Configurar SQL Server Express para iniciar automáticamente:**
   ```powershell
   Set-Service "MSSQL$SQLEXPRESS" -StartupType Automatic
   ```

3. **Verificar cadena de conexión correcta:**
   - Usa el script de diagnóstico para encontrar la cadena que funciona
   - Guarda esa cadena en `backend/NeoLibro.WebAPI/appsettings.json`

4. **Documentar tu configuración:**
   - Anota qué instancia de SQL Server usas
   - Guarda la cadena de conexión que funciona

### Mejores Prácticas

1. ✅ **Siempre reiniciar el backend** después de cambiar `appsettings.json`
2. ✅ **Usar `TrustServerCertificate=True`** para desarrollo local
3. ✅ **Verificar servicios antes de iniciar el backend**
4. ✅ **Mantener SQL Server Browser habilitado** si usas instancias nombradas
5. ✅ **Usar el script de diagnóstico** cuando tengas problemas

---

## 📚 Referencia Rápida

### Cadenas de Conexión Comunes

| Tipo de Instalación | Cadena de Conexión |
|---------------------|-------------------|
| SQL Server Express (instancia nombrada) | `Server=.\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;` |
| SQL Server Express (con localhost) | `Server=localhost\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;` |
| SQL Server Default (sin instancia) | `Server=localhost;Database=BibliotecaFISI;Trusted_Connection=True;` |
| Con puerto específico | `Server=localhost,1433;Database=BibliotecaFISI;Trusted_Connection=True;` |

### Comandos PowerShell Útiles

```powershell
# Ver servicios de SQL Server
Get-Service | Where-Object { $_.Name -like "*SQL*" }

# Iniciar SQL Server Express
Start-Service "MSSQL$SQLEXPRESS"

# Iniciar SQL Browser
Start-Service SQLBrowser

# Configurar inicio automático
Set-Service SQLBrowser -StartupType Automatic
Set-Service "MSSQL$SQLEXPRESS" -StartupType Automatic

# Ver estado de servicios
Get-Service "MSSQL*SQLEXPRESS*", SQLBrowser
```

### Ubicación de Archivos de Configuración

- `backend/NeoLibro.WebAPI/appsettings.json` - Configuración principal
- `backend/NeoLibro.WebAPI/appsettings.Development.json` - Configuración de desarrollo
- `diagnostico_sql.ps1` - Script de verificación (en la raíz del proyecto)

---

## 🆘 Soporte Adicional

Si después de seguir esta guía sigues teniendo problemas:

1. **Ejecuta el script de diagnóstico completo**
2. **Toma capturas de pantalla de:**
   - Servicios de Windows (services.msc)
   - SQL Server Configuration Manager
   - El error completo del backend
3. **Documenta:**
   - Versión de SQL Server instalada
   - Versión de Windows
   - Qué cadena de conexión probaste

---

## 📌 Resumen

**Los problemas más comunes son:**
1. ❌ SQL Server no está corriendo → **Solución:** Iniciar servicio
2. ❌ SQL Browser no está habilitado → **Solución:** Habilitar e iniciar
3. ❌ Cadena de conexión incorrecta → **Solución:** Usar script de diagnóstico
4. ❌ Backend no reiniciado → **Solución:** Reiniciar después de cambios

**Recuerda:** Cuando cambies `appsettings.json`, **siempre reinicia el backend**.

---

*Última actualización: 2025*
*Versión: 1.0*


