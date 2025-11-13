# 📊 REPORTES DISPONIBLES - BIBLIOTECA FISI

Este documento lista todos los reportes que puedes generar con el sistema.

## 🚀 Generación Rápida

Para generar todos los reportes rápidamente, ejecuta:

```bash
python generar_reportes.py
```

## 📋 Lista de Reportes

### 1. **Estadísticas Generales**
- Total de usuarios activos
- Total de libros en catálogo
- Total de ejemplares
- Préstamos activos
- Préstamos vencidos
- Multas pendientes
- Monto total de multas

**Endpoint API:** `GET /api/Reportes/estadisticas-generales`

### 2. **Préstamos por Mes**
- Distribución mensual de préstamos
- Total anual de préstamos
- Gráfico de barras en consola

**Endpoint API:** `GET /api/Reportes/prestamos-por-mes?año=2024`

### 3. **Libros Más Prestados**
- Top 10 libros más solicitados
- Cantidad de préstamos por libro
- Ranking ordenado por popularidad

**Endpoint API:** `GET /api/Reportes/libros-mas-prestados?limite=10`

### 4. **Usuarios Más Activos**
- Top 10 usuarios con más préstamos
- Cantidad de préstamos por usuario
- Ranking de usuarios más frecuentes

**Endpoint API:** `GET /api/Reportes/usuarios-mas-activos?limite=10`

### 5. **Estadísticas por Rol**
- Distribución de usuarios por rol
- Cantidad y porcentaje por cada rol
- Roles: Estudiante, Profesor, Bibliotecaria, Administrador

**Endpoint API:** `GET /api/Reportes/estadisticas-por-rol`

### 6. **Actividad Diaria**
- Préstamos realizados hoy
- Devoluciones realizadas hoy
- Multas generadas hoy
- Multas pagadas hoy

**Endpoint API:** `GET /api/Reportes/actividad-diaria?fecha=2024-01-15`

### 7. **Rendimiento de Biblioteca**
- Análisis de rendimiento en un período (por defecto 6 meses)
- Total de préstamos
- Préstamos completados vs vencidos
- Tasa de devolución
- Total de multas y monto
- Tasa de pago de multas

**Endpoint API:** `GET /api/Reportes/rendimiento-biblioteca?meses=6`

## 📁 Formatos de Salida

El script `generar_reportes.py` genera:

1. **Salida en consola**: Reportes formateados con gráficos ASCII
2. **Archivo JSON**: `reportes_biblioteca.json` con todos los datos estructurados

## 🔧 Requisitos

- Python 3.7+
- pyodbc
- SQL Server con base de datos `BibliotecaFISI`
- Permisos de lectura en la base de datos

## 📝 Notas

- Todos los reportes requieren autenticación como Administrador en la API
- El script se conecta directamente a la base de datos para mayor velocidad
- Los reportes se generan en tiempo real desde los datos actuales

