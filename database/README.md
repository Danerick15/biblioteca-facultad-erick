# Base de Datos Biblioteca FISI

## Archivos Necesarios para Recrear la Base de Datos

### 1. Archivos de Datos
- `CATALOGO DE LIBROS FISI RC.csv` - Catálogo original con todos los libros y ejemplares
- `CATALOGO DE LIBROS FISI RC.xlsx` - Versión Excel del catálogo

### 2. Scripts de Base de Datos
- `BibliotecaFISI_Simplificado.sql` - Script SQL para crear la estructura de la base de datos

### 3. Scripts de Migración
- `cargar_datos_completos.py` - Script Python para cargar TODOS los datos (libros, autores, categorías, ejemplares)
- `crear_administrador.py` - Script Python para crear un administrador inicial
- `verificar_conexion.py` - Script Python para verificar la conexión a SQL Server y detectar instancias disponibles

## Instrucciones para Recrear la Base de Datos

### Paso 0: Verificar Conexión a SQL Server (Opcional pero Recomendado)
Si tienes problemas de conexión, ejecuta primero el script de verificación:
```bash
python verificar_conexion.py
```
Este script te ayudará a:
- Detectar qué instancias de SQL Server están disponibles
- Verificar qué servicios de SQL Server están ejecutándose
- Probar conexiones con diferentes configuraciones
- Identificar qué servidor usar para los scripts de carga

### Paso 1: Crear la Base de Datos
```sql
-- Ejecutar en SQL Server Management Studio
-- El script BibliotecaFISI_Simplificado.sql contiene toda la estructura
```

### Paso 2: Instalar Dependencias Python
```bash
pip install pyodbc pandas
```

### Paso 3: Cargar TODOS los Datos
```bash
python cargar_datos_completos.py
```
**Nota:** El script ahora intenta conectarse automáticamente a diferentes configuraciones comunes de SQL Server (localhost, localhost\SQLEXPRESS, etc.)

### Paso 4: Crear Administrador Inicial
```bash
python crear_administrador.py
```

## Resultado Final
- **1,326 libros** únicos (después de limpieza de duplicados)
- **3,373 ejemplares** totales
- **974 autores** únicos (divididos correctamente por comas)
- **1,469 relaciones** libro-autor
- **1,325 relaciones** libro-categoría
- **34 categorías** LCC
- Todos los ejemplares en estado "Disponible"
- **0 libros huérfanos** (todos tienen ejemplares y autores)

## Nota Importante
La lógica de deduplicación usa **todas las columnas bibliográficas** (Título, Autor, Año, Signatura LCC) para identificar libros únicos, no solo el título. Esto significa que libros con el mismo título pero diferentes autores, años o signaturas se consideran libros distintos.

## Limpieza Automática
El script incluye una **limpieza automática** que elimina libros huérfanos (sin ejemplares y sin autores) que pueden generarse durante el proceso de carga. Esto garantiza que todos los libros en la base de datos tengan datos completos y sean funcionales.

## Solución de Problemas de Conexión

Si encuentras errores de conexión como "Named Pipes Provider: Could not open a connection to SQL Server":

1. **Verifica que SQL Server esté ejecutándose:**
   - Abre "SQL Server Configuration Manager"
   - Verifica que el servicio "SQL Server (MSSQLSERVER)" o "SQL Server (SQLEXPRESS)" esté en estado "Running"
   - Si no está ejecutándose, inícialo desde el Administrador de tareas o Services

2. **Ejecuta el script de verificación:**
   ```bash
   python verificar_conexion.py
   ```
   Esto te mostrará qué instancias están disponibles y funcionando.

3. **Configuraciones comunes de SQL Server:**
   - SQL Server por defecto: `localhost`
   - SQL Server Express: `localhost\SQLEXPRESS`
   - Si tienes una instancia con nombre personalizado: `localhost\NOMBRE_INSTANCIA`

4. **Si ninguna configuración funciona:**
   - Verifica que la base de datos "BibliotecaFISI" exista
   - Verifica que tengas permisos de autenticación de Windows
   - Verifica que el puerto 1433 esté abierto (si usas TCP/IP)

## Requisitos del Sistema
- SQL Server (local o remoto)
- Python 3.x
- pyodbc
- pandas
- ODBC Driver 17 for SQL Server
