# 🗄️ Base de Datos - Biblioteca FISI

Documentación completa para configurar y cargar la base de datos del sistema.

---

## 📋 Tabla de Contenidos

- [Archivos Necesarios](#-archivos-necesarios)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Resultado Final](#-resultado-final)
- [Solución de Problemas](#-solución-de-problemas)
- [Requisitos del Sistema](#-requisitos-del-sistema)

---

## 📦 Archivos Necesarios

### Scripts SQL
- **`scripts/sql/BibliotecaFISI_Simplificado.sql`** - Script principal para crear la estructura completa de la base de datos
- **`scripts/sql/agregar_libros_digitales.sql`** - Script para agregar libros digitales
- **`scripts/sql/crear_tabla_api_keys.sql`** - Crea la tabla para API Keys
- **`scripts/sql/crear_profesor.sql`** - Script para crear profesor
- **`scripts/sql/eliminar_administrador.sql`** - Script para eliminar administrador
- **`scripts/sql/ver_tablas.sql`** - Script para ver información de tablas

### Scripts Python
- **`scripts/python/cargar_datos_completos.py`** - Carga todos los datos (libros, autores, categorías, ejemplares)
- **`scripts/python/crear_administrador.py`** - Crea un usuario administrador inicial
- **`scripts/python/crear_profesor.py`** - Crea un usuario profesor de prueba
- **`scripts/python/verificar_conexion.py`** - Verifica la conexión a SQL Server y detecta instancias disponibles
- **`scripts/python/generar_reportes.py`** - Genera reportes del sistema

### Archivos de Datos
- **`data/CATALOGO DE LIBROS FISI RC.csv`** - Catálogo completo de libros
- **`data/reportes_biblioteca.json`** - Configuración de reportes

---

## 🚀 Instalación Paso a Paso

### Paso 0: Verificar Conexión a SQL Server (Recomendado)

Si tienes problemas de conexión, ejecuta primero el script de verificación:

```bash
cd database/scripts/python
python verificar_conexion.py
```

Este script te ayudará a:
- ✅ Detectar qué instancias de SQL Server están disponibles
- ✅ Verificar qué servicios de SQL Server están ejecutándose
- ✅ Probar conexiones con diferentes configuraciones
- ✅ Identificar qué servidor usar para los scripts de carga

### Paso 1: Crear la Base de Datos

1. **Abrir SQL Server Management Studio (SSMS)**

2. **Ejecutar el script principal:**
   ```sql
   -- Abrir y ejecutar: database/scripts/sql/BibliotecaFISI_Simplificado.sql
   ```

   Este script crea:
   - Todas las tablas necesarias
   - Relaciones entre tablas
   - Índices para optimización
   - Procedimientos almacenados básicos

### Paso 2: Instalar Dependencias Python

```bash
pip install pyodbc pandas
```

**Requisitos:**
- Python 3.7 o superior
- ODBC Driver 17 for SQL Server (o superior)

### Paso 3: Cargar Todos los Datos

```bash
cd database/scripts/python
python cargar_datos_completos.py
```

**Nota:** El script intenta conectarse automáticamente a diferentes configuraciones comunes:
- `localhost`
- `localhost\SQLEXPRESS`
- `localhost\MSSQLSERVER`

**Este script carga:**
- 📚 Libros con información bibliográfica completa
- 👤 Autores (divididos correctamente por comas)
- 📂 Categorías LCC (Library of Congress Classification)
- 📖 Ejemplares con códigos de barras
- 🔗 Relaciones libro-autor
- 🔗 Relaciones libro-categoría

### Paso 4: Crear Usuario Administrador

```bash
cd database/scripts/python
python crear_administrador.py
```

Esto crea un usuario administrador con:
- **Email:** `admin@unmsm.edu.pe`
- **Contraseña:** Configurable en el script
- **Rol:** Administrador

### Paso 5: Crear Usuario Profesor (Opcional)

```bash
cd database/scripts/python
python crear_profesor.py
```

O ejecutar el script SQL:
```sql
-- Ejecutar: database/scripts/sql/crear_profesor.sql
```

---

## 📊 Resultado Final

Después de ejecutar todos los scripts, tendrás:

| Recurso | Cantidad |
|---------|----------|
| 📚 **Libros únicos** | 1,326 |
| 📖 **Ejemplares totales** | 3,373 |
| 👤 **Autores únicos** | 974 |
| 🔗 **Relaciones libro-autor** | 1,469 |
| 🔗 **Relaciones libro-categoría** | 1,325 |
| 📂 **Categorías LCC** | 34 |
| ✅ **Estado inicial** | Todos los ejemplares en "Disponible" |
| ✅ **Integridad** | 0 libros huérfanos |

### Características de la Carga

- ✅ **Deduplicación inteligente:** Usa todas las columnas bibliográficas (Título, Autor, Año, Signatura LCC) para identificar libros únicos
- ✅ **Limpieza automática:** Elimina libros huérfanos (sin ejemplares y sin autores)
- ✅ **Integridad de datos:** Todos los libros tienen ejemplares y autores asociados

---

## 🔧 Solución de Problemas

### Error: "Named Pipes Provider: Could not open a connection to SQL Server"

#### 1. Verificar que SQL Server esté ejecutándose

**Windows:**
- Abre "SQL Server Configuration Manager"
- Verifica que el servicio esté en estado "Running"
- Si no está ejecutándose, inícialo desde:
  - Administrador de tareas → Servicios
  - O Services.msc

**Configuraciones comunes:**
- SQL Server por defecto: `localhost` o `localhost\MSSQLSERVER`
- SQL Server Express: `localhost\SQLEXPRESS`
- Instancia personalizada: `localhost\NOMBRE_INSTANCIA`

#### 2. Ejecutar script de verificación

```bash
python verificar_conexion.py
```

Este script mostrará:
- ✅ Qué instancias están disponibles
- ✅ Qué servicios están ejecutándose
- ✅ Configuraciones de conexión que funcionan

#### 3. Verificar configuración de red

- **Puerto TCP/IP:** Verificar que el puerto 1433 esté abierto
- **Protocolos habilitados:** TCP/IP debe estar habilitado en SQL Server Configuration Manager
- **Firewall:** Asegurarse de que el firewall permita conexiones a SQL Server

#### 4. Verificar permisos

- **Autenticación de Windows:** Asegurarse de tener permisos
- **Autenticación SQL:** Verificar usuario y contraseña
- **Permisos de base de datos:** Verificar que el usuario tenga permisos para crear/insertar

#### 5. Verificar que la base de datos exista

```sql
-- Ejecutar en SSMS
SELECT name FROM sys.databases WHERE name = 'BibliotecaFISI';
```

Si no existe, ejecutar primero `BibliotecaFISI_Simplificado.sql`

---

## 📋 Requisitos del Sistema

### Software Necesario

| Software | Versión Mínima | Descripción |
|----------|----------------|-------------|
| **SQL Server** | 2019+ | Base de datos |
| **SQL Server Management Studio** | Latest | Herramienta de gestión |
| **Python** | 3.7+ | Scripts de carga |
| **ODBC Driver** | 17+ | Conector para Python |

### Dependencias Python

```bash
pip install pyodbc pandas
```

### Verificar Instalación

```bash
# Verificar Python
python --version

# Verificar pip
pip --version

# Verificar pyodbc
python -c "import pyodbc; print(pyodbc.version)"
```

---

## 📝 Notas Importantes

### Deduplicación de Libros

La lógica de deduplicación usa **todas las columnas bibliográficas** para identificar libros únicos:
- Título
- Autor
- Año
- Signatura LCC

Esto significa que libros con el mismo título pero diferentes autores, años o signaturas se consideran **libros distintos**.

### Limpieza Automática

El script incluye una **limpieza automática** que elimina:
- ❌ Libros sin ejemplares
- ❌ Libros sin autores
- ❌ Datos inconsistentes

Esto garantiza que todos los libros en la base de datos sean funcionales y tengan datos completos.

### Datos de Ejemplo

El catálogo original (`CATALOGO DE LIBROS FISI RC.csv`) contiene datos reales de la biblioteca. Después del procesamiento:
- Se eliminan duplicados
- Se normalizan autores
- Se asignan códigos de barras únicos
- Se crean relaciones correctas

---

## 🔗 Enlaces Útiles

- [Documentación Principal](../../README.md)
- [Configurar SQL Server](../CONFIGURAR_SQL_SERVER.md)
- [Troubleshooting SQL Server](../TROUBLESHOOTING_SQL_SERVER.md)
- [Instrucciones de Ejecución](../INSTRUCCIONES_EJECUCION.md)

---

<div align="center">

**¿Problemas?** Consulta la sección de [Solución de Problemas](#-solución-de-problemas) o revisa [`TROUBLESHOOTING_SQL_SERVER.md`](../TROUBLESHOOTING_SQL_SERVER.md)

</div>
