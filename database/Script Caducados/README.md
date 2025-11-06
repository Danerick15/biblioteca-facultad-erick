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

## Instrucciones para Recrear la Base de Datos

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

## Requisitos del Sistema
- SQL Server (local o remoto)
- Python 3.x
- pyodbc
- pandas
- ODBC Driver 17 for SQL Server
