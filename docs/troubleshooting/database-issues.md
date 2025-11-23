# 🗄️ Problemas de Base de Datos

Guía específica para resolver problemas relacionados con SQL Server y la base de datos.

---

## 🔌 Problemas de Conexión

### Error: "Named Pipes Provider: Could not open a connection"

**Causa:** SQL Server no está ejecutándose o la instancia es incorrecta.

**Solución:**

1. **Verificar que SQL Server esté ejecutándose:**
   ```powershell
   # En PowerShell
   Get-Service | Where-Object {$_.Name -like "*SQL*"}
   ```

2. **Iniciar SQL Server:**
   - Abre "SQL Server Configuration Manager"
   - Ve a "SQL Server Services"
   - Inicia el servicio "SQL Server (MSSQLSERVER)" o "SQL Server (SQLEXPRESS)"

3. **Verificar instancia:**
   ```bash
   # Ejecutar script de verificación
   python database/verificar_conexion.py
   ```

### Error: "Login failed for user"

**Causa:** Credenciales incorrectas o autenticación no configurada.

**Solución:**

1. **Usar autenticación de Windows:**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=BibliotecaFISI;Integrated Security=true;TrustServerCertificate=true;"
     }
   }
   ```

2. **O verificar usuario SQL:**
   - Abre SQL Server Management Studio
   - Verifica que el usuario exista y tenga permisos

---

## 📊 Problemas de Datos

### Error: "Table doesn't exist"

**Solución:**
1. Ejecuta el script de creación:
   ```sql
   -- Ejecutar: database/BibliotecaFISI_Simplificado.sql
   ```

2. Verifica que todas las tablas se crearon:
   ```sql
   SELECT TABLE_NAME 
   FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_TYPE = 'BASE TABLE';
   ```

### Error: "Foreign key constraint failed"

**Causa:** Datos inconsistentes o relaciones incorrectas.

**Solución:**
1. Verifica las relaciones en el modelo
2. Asegúrate de que los datos referenciados existan
3. Revisa los scripts de carga de datos

---

## 🔄 Problemas de Migraciones

### Error: "Migration already applied"

**Solución:**
```bash
# Ver migraciones aplicadas
dotnet ef migrations list

# Si necesitas resetear
dotnet ef database drop
dotnet ef database update
```

---

## 📈 Rendimiento

### Base de datos lenta

**Solución:**
1. Verifica índices:
   ```sql
   -- Ver índices existentes
   SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('TablaNombre');
   ```

2. Actualiza estadísticas:
   ```sql
   UPDATE STATISTICS NombreTabla;
   ```

---

## 🔍 Scripts de Diagnóstico

### Verificar Conexión

```bash
python database/verificar_conexion.py
```

### Ver Tablas

```sql
-- Ejecutar: database/ver_tablas.sql
```

### Verificar Datos

```sql
SELECT 
    (SELECT COUNT(*) FROM Libros) AS TotalLibros,
    (SELECT COUNT(*) FROM Ejemplares) AS TotalEjemplares,
    (SELECT COUNT(*) FROM Usuarios) AS TotalUsuarios;
```

---

## 📚 Referencias

- [Configuración de Base de Datos](../guides/database-setup.md)
- [Problemas Comunes](common-issues.md)

