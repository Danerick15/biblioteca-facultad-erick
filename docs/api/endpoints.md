# 📡 Endpoints de la API

Referencia completa de todos los endpoints disponibles en la API.

---

## 🔐 Autenticación

### Login Tradicional
```http
POST /api/Auth/login
Content-Type: application/json

{
  "email": "usuario@unmsm.edu.pe",
  "password": "contraseña"
}
```

### SSO con Google
```http
POST /api/Auth/sso/google
Content-Type: application/json

{
  "idToken": "token-de-google"
}
```

### Logout
```http
POST /api/Auth/logout
```

---

## 📚 Libros

### Listar Libros
```http
GET /api/Libros
```

### Obtener Libro por ID
```http
GET /api/Libros/{id}
```

### Crear Libro
```http
POST /api/Libros
Content-Type: application/json

{
  "titulo": "Título",
  "isbn": "1234567890",
  "anio": 2023,
  "editorial": "Editorial"
}
```

### Actualizar Libro
```http
PUT /api/Libros/{id}
```

### Eliminar Libro
```http
DELETE /api/Libros/{id}
```

### Carga Masiva
```http
POST /api/Libros/carga-masiva
Content-Type: multipart/form-data

archivo: [archivo CSV/Excel]
```

---

## 👥 Usuarios

### Listar Usuarios
```http
GET /api/Usuarios
```

### Buscar Usuarios
```http
GET /api/Usuarios/buscar?termino=busqueda
```

### Crear Usuario
```http
POST /api/Usuarios
```

---

## 🔄 Préstamos

### Listar Préstamos Activos
```http
GET /api/Prestamos/activos
```

### Mis Préstamos
```http
GET /api/Prestamos/mis-prestamos
```

### Crear Préstamo
```http
POST /api/Prestamos
Content-Type: application/json

{
  "ejemplarID": 1,
  "usuarioID": 1
}
```

### Procesar Devolución
```http
PUT /api/Prestamos/{id}/devolucion
Content-Type: application/json

{
  "observaciones": "Observaciones opcionales"
}
```

---

## 📊 Reportes

### Estadísticas Generales
```http
GET /api/Reportes/estadisticas-generales
```

### Préstamos por Mes
```http
GET /api/Reportes/prestamos-por-mes?anio=2024
```

### Libros Más Prestados
```http
GET /api/Reportes/libros-mas-prestados?topN=10
```

---

## 🌐 API Pública

Ver [Documentación de API Pública](public-api.md) para endpoints públicos.

---

## 📖 Documentación Interactiva

Accede a Swagger UI cuando el backend esté ejecutándose:
```
http://localhost:5000/swagger
```

