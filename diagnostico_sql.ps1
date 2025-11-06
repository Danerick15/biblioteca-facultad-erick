# Script de Diagnóstico SQL Server
# Ejecuta este script cuando tengas problemas de conexión
# Ubicado en la raíz del proyecto

Write-Host "=== DIAGNÓSTICO SQL SERVER ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar servicios
Write-Host "1. VERIFICANDO SERVICIOS:" -ForegroundColor Yellow
$sqlService = Get-Service | Where-Object { $_.Name -like "MSSQL*SQLEXPRESS*" } | Select-Object -First 1
$browserService = Get-Service SQLBrowser -ErrorAction SilentlyContinue

if ($sqlService) {
    $status = if ($sqlService.Status -eq "Running") { "✅" } else { "❌" }
    $color = if ($sqlService.Status -eq "Running") { "Green" } else { "Red" }
    Write-Host "   $status SQL Server (SQLEXPRESS): $($sqlService.Status)" -ForegroundColor $color
    Write-Host "      Nombre del servicio: $($sqlService.Name)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ SQL Server (SQLEXPRESS) no encontrado" -ForegroundColor Red
    Write-Host "      Buscando otras instancias..." -ForegroundColor Gray
    $otherServices = Get-Service | Where-Object { $_.DisplayName -like "*SQL Server*" -and $_.Name -notlike "*Browser*" }
    if ($otherServices) {
        Write-Host "      Instancias encontradas:" -ForegroundColor Gray
        foreach ($svc in $otherServices) {
            Write-Host "        - $($svc.DisplayName) ($($svc.Name)): $($svc.Status)" -ForegroundColor Gray
        }
    }
}

if ($browserService) {
    $status = if ($browserService.Status -eq "Running") { "✅" } else { "❌" }
    $color = if ($browserService.Status -eq "Running") { "Green" } else { "Red" }
    Write-Host "   $status SQL Server Browser: $($browserService.Status)" -ForegroundColor $color
} else {
    Write-Host "   ❌ SQL Server Browser no encontrado" -ForegroundColor Red
    Write-Host "      ⚠️ IMPORTANTE: SQL Browser es necesario para conexiones por nombre de instancia" -ForegroundColor Yellow
}

# 2. Probar conexiones
Write-Host ""
Write-Host "2. PROBANDO CONEXIONES:" -ForegroundColor Yellow

# Obtener nombre de la PC
$computerName = $env:COMPUTERNAME

$connectionStrings = @(
    @{Name="Punto + SQLEXPRESS"; Value="Server=.\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;TrustServerCertificate=True;"},
    @{Name="Localhost + SQLEXPRESS"; Value="Server=localhost\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;TrustServerCertificate=True;"},
    @{Name="Nombre PC + SQLEXPRESS"; Value="Server=$computerName\\SQLEXPRESS;Database=BibliotecaFISI;Trusted_Connection=True;TrustServerCertificate=True;"},
    @{Name="Localhost (sin instancia)"; Value="Server=localhost;Database=BibliotecaFISI;Trusted_Connection=True;TrustServerCertificate=True;"}
)

$working = $null
$workingName = $null

foreach ($conn in $connectionStrings) {
    try {
        $connObj = New-Object System.Data.SqlClient.SqlConnection($conn.Value)
        $connObj.Open()
        $connObj.Close()
        Write-Host "   ✅ FUNCIONA: $($conn.Name)" -ForegroundColor Green
        Write-Host "      Cadena: $($conn.Value.Split(';')[0])" -ForegroundColor Gray
        if (-not $working) {
            $working = $conn.Value
            $workingName = $conn.Name
        }
    } catch {
        Write-Host "   ❌ No funciona: $($conn.Name)" -ForegroundColor Red
        Write-Host "      Error: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor DarkGray
    }
}

# 3. Verificar base de datos
if ($working) {
    Write-Host ""
    Write-Host "3. VERIFICANDO BASE DE DATOS:" -ForegroundColor Yellow
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($working)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT name FROM sys.databases WHERE name = 'BibliotecaFISI'"
        $result = $cmd.ExecuteScalar()
        if ($result) {
            Write-Host "   ✅ Base de datos 'BibliotecaFISI' existe" -ForegroundColor Green
            
            # Verificar tabla Usuarios
            $cmd.CommandText = "SELECT COUNT(*) FROM Usuarios"
            $userCount = $cmd.ExecuteScalar()
            Write-Host "      Usuarios en la base de datos: $userCount" -ForegroundColor Gray
        } else {
            Write-Host "   ❌ Base de datos 'BibliotecaFISI' NO existe" -ForegroundColor Red
            Write-Host "      Debes crear la base de datos primero" -ForegroundColor Yellow
        }
        $conn.Close()
    } catch {
        Write-Host "   ⚠️ No se pudo verificar la base de datos" -ForegroundColor Yellow
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor DarkGray
    }
} else {
    Write-Host ""
    Write-Host "3. NO SE PUDO VERIFICAR LA BASE DE DATOS" -ForegroundColor Yellow
    Write-Host "   (Ninguna conexión funcionó)" -ForegroundColor Gray
}

# 4. Verificar archivo de configuración
Write-Host ""
Write-Host "4. VERIFICANDO CONFIGURACIÓN DEL BACKEND:" -ForegroundColor Yellow

$appsettingsPath = "backend\NeoLibro.WebAPI\appsettings.json"
$appsettingsDevPath = "backend\NeoLibro.WebAPI\appsettings.Development.json"

if (Test-Path $appsettingsPath) {
    Write-Host "   ✅ appsettings.json encontrado" -ForegroundColor Green
    try {
        $json = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
        if ($json.ConnectionStrings.cnnNeoLibroDB) {
            $connStr = $json.ConnectionStrings.cnnNeoLibroDB
            Write-Host "      Cadena actual: $($connStr.Split(';')[0])" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️ No se encontró ConnectionStrings en appsettings.json" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️ Error al leer appsettings.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ appsettings.json no encontrado en: $appsettingsPath" -ForegroundColor Red
}

if (Test-Path $appsettingsDevPath) {
    Write-Host "   ✅ appsettings.Development.json encontrado" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ appsettings.Development.json no encontrado" -ForegroundColor Yellow
}

# 5. Recomendaciones
Write-Host ""
Write-Host "5. RECOMENDACIONES:" -ForegroundColor Yellow

$hasRecommendations = $false

if (-not $sqlService -or $sqlService.Status -ne "Running") {
    Write-Host "   → Iniciar SQL Server Express:" -ForegroundColor White
    if ($sqlService) {
        Write-Host "     Start-Service '$($sqlService.Name)'" -ForegroundColor Cyan
    } else {
        Write-Host "     Start-Service 'MSSQL`$SQLEXPRESS'" -ForegroundColor Cyan
    }
    Write-Host "     O configurar inicio automático:" -ForegroundColor White
    if ($sqlService) {
        Write-Host "     Set-Service '$($sqlService.Name)' -StartupType Automatic" -ForegroundColor Cyan
    }
    $hasRecommendations = $true
}

if (-not $browserService -or $browserService.Status -ne "Running") {
    Write-Host "   → Iniciar SQL Server Browser:" -ForegroundColor White
    Write-Host "     Start-Service SQLBrowser" -ForegroundColor Cyan
    Write-Host "     Set-Service SQLBrowser -StartupType Automatic" -ForegroundColor Cyan
    Write-Host "     ⚠️ IMPORTANTE: Necesario para conexiones por nombre de instancia" -ForegroundColor Yellow
    $hasRecommendations = $true
}

if (-not $working) {
    Write-Host "   → Verificar que SQL Server esté instalado correctamente" -ForegroundColor White
    Write-Host "   → Verificar que la instancia se llame 'SQLEXPRESS'" -ForegroundColor White
    Write-Host "   → Intentar conectarte manualmente con SQL Server Management Studio" -ForegroundColor White
    $hasRecommendations = $true
} else {
    Write-Host "   ✅ CONEXIÓN EXITOSA ENCONTRADA" -ForegroundColor Green
    Write-Host ""
    Write-Host "   → Usa esta cadena en backend/NeoLibro.WebAPI/appsettings.json:" -ForegroundColor White
    Write-Host "     $working" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   → Después de actualizar appsettings.json:" -ForegroundColor White
    Write-Host "     1. Reinicia el backend (Ctrl+C y luego dotnet run)" -ForegroundColor Cyan
    Write-Host "     2. Prueba el login nuevamente" -ForegroundColor Cyan
}

if (-not $hasRecommendations) {
    Write-Host "   ✅ Todo parece estar configurado correctamente" -ForegroundColor Green
    Write-Host "   → Si aún tienes problemas, verifica:" -ForegroundColor White
    Write-Host "     - Que el backend esté reiniciado después de cambios" -ForegroundColor Cyan
    Write-Host "     - Que la base de datos 'BibliotecaFISI' exista" -ForegroundColor Cyan
    Write-Host "     - Que el firewall no esté bloqueando conexiones" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== FIN DEL DIAGNÓSTICO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para más información, consulta: TROUBLESHOOTING_SQL_SERVER.md" -ForegroundColor Gray


