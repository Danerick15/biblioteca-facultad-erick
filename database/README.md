# 🗄️ Base de Datos - Scripts y Datos

Esta carpeta contiene todos los scripts SQL, scripts Python y archivos de datos necesarios para configurar y gestionar la base de datos del sistema.

---

## 📁 Estructura

```
database/
├── scripts/
│   ├── sql/              # Scripts SQL
│   │   ├── BibliotecaFISI_Simplificado.sql  # Script principal de creación
│   │   ├── agregar_libros_digitales.sql
│   │   ├── crear_tabla_api_keys.sql
│   │   ├── crear_profesor.sql
│   │   ├── eliminar_administrador.sql
│   │   └── ver_tablas.sql
│   └── python/           # Scripts Python
│       ├── cargar_datos_completos.py
│       ├── crear_administrador.py
│       ├── crear_profesor.py
│       ├── generar_reportes.py
│       └── verificar_conexion.py
└── data/                 # Archivos de datos
    ├── CATALOGO DE LIBROS FISI RC.csv
    └── reportes_biblioteca.json
```

---

## 🚀 Uso Rápido

### 1. Crear la Base de Datos

Ejecuta el script principal en SQL Server Management Studio:

```sql
-- Archivo: scripts/sql/BibliotecaFISI_Simplificado.sql
```

### 2. Cargar Datos

```bash
cd scripts/python
python cargar_datos_completos.py
```

### 3. Crear Usuario Administrador

```bash
python crear_administrador.py
```

---

## 📚 Documentación Completa

Para una guía detallada, consulta:
- **[Guía de Configuración de Base de Datos](../docs/guides/database-setup.md)** - Instrucciones completas paso a paso

---

## 📋 Scripts Disponibles

### Scripts SQL

| Script | Descripción |
|--------|-------------|
| `BibliotecaFISI_Simplificado.sql` | Script principal - Crea toda la estructura de la BD |
| `agregar_libros_digitales.sql` | Agrega soporte para libros digitales |
| `crear_tabla_api_keys.sql` | Crea tabla para API Keys |
| `crear_profesor.sql` | Crea usuario profesor de prueba |
| `eliminar_administrador.sql` | Elimina usuario administrador |
| `ver_tablas.sql` | Muestra información de todas las tablas |

### Scripts Python

| Script | Descripción |
|--------|-------------|
| `cargar_datos_completos.py` | Carga todos los datos (libros, autores, ejemplares) |
| `crear_administrador.py` | Crea usuario administrador |
| `crear_profesor.py` | Crea usuario profesor |
| `generar_reportes.py` | Genera reportes del sistema |
| `verificar_conexion.py` | Verifica conexión a SQL Server |

---

## 📦 Archivos de Datos

- **`CATALOGO DE LIBROS FISI RC.csv`** - Catálogo completo de libros con 3,374 ejemplares
- **`reportes_biblioteca.json`** - Configuración de reportes disponibles

---

## ⚠️ Notas Importantes

- Ejecuta los scripts SQL en el orden indicado en la documentación
- Los scripts Python requieren Python 3.7+ y las dependencias instaladas
- Verifica la conexión a SQL Server antes de ejecutar scripts

---

## 🔗 Enlaces Útiles

- [Documentación de Base de Datos](../docs/guides/database-setup.md)
- [Problemas de Base de Datos](../docs/troubleshooting/database-issues.md)

