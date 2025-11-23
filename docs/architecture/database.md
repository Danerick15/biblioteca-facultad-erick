# 🗄️ Arquitectura de Base de Datos

Documentación del modelo de datos y estructura de la base de datos.

---

## 📊 Modelo de Datos

### Entidades Principales

#### Libros
- `LibroID` (PK)
- `Titulo`
- `ISBN`
- `Anio`
- `Editorial`
- `SignaturaLCC`
- `Resumen`

#### Ejemplares
- `EjemplarID` (PK)
- `LibroID` (FK)
- `NumeroEjemplar`
- `CodigoBarras`
- `Estado` (Disponible, Prestado, Reservado, etc.)
- `Ubicacion`

#### Usuarios
- `UsuarioID` (PK)
- `Nombre`
- `EmailInstitucional`
- `CodigoUniversitario`
- `Rol` (Administrador, Bibliotecaria, Profesor, Estudiante)

#### Préstamos
- `PrestamoID` (PK)
- `EjemplarID` (FK)
- `UsuarioID` (FK)
- `FechaPrestamo`
- `FechaVencimiento`
- `FechaDevolucion`
- `Estado`

---

## 🔗 Relaciones

```
Libros 1:N Ejemplares
Libros N:M Autores (tabla intermedia)
Libros N:M Categorias (tabla intermedia)
Ejemplares 1:N Prestamos
Usuarios 1:N Prestamos
```

---

## 📈 Índices

Índices principales para optimización:
- `CodigoBarras` en Ejemplares
- `EmailInstitucional` en Usuarios
- `ISBN` en Libros
- `FechaPrestamo` en Préstamos

---

## 🔍 Consultas Comunes

Ver [Guía de Base de Datos](../guides/database-setup.md) para más información.

