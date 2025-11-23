# 🌐 API Pública

Documentación completa de la API pública del sistema con autenticación por API Key.

---

## 🔑 Autenticación

Todas las requests a la API pública requieren una API Key válida en el header:

```http
X-API-Key: tu-api-key-aqui
```

### Obtener API Key

Las API Keys se generan desde la aplicación web (como administrador) o directamente en la base de datos.

---

## 📡 Base URL

```
http://localhost:5000/api/PublicApi
```

En producción, reemplaza `localhost:5000` con tu dominio.

---

## 📚 Endpoints

### Obtener Todos los Libros

```http
GET /api/PublicApi/libros
```

**Headers:**
```
X-API-Key: tu-api-key
```

**Respuesta:**
```json
[
  {
    "libroID": 1,
    "titulo": "Título del Libro",
    "isbn": "1234567890",
    "anio": 2023,
    "editorial": "Editorial",
    "categoria": "Categoría LCC",
    "disponible": true
  }
]
```

### Obtener Libro por ID

```http
GET /api/PublicApi/libros/{id}
```

**Parámetros:**
- `id` (int)` - ID del libro

**Respuesta:**
```json
{
  "libroID": 1,
  "titulo": "Título del Libro",
  "isbn": "1234567890",
  "anio": 2023,
  "editorial": "Editorial",
  "categoria": "Categoría LCC",
  "autores": ["Autor 1", "Autor 2"],
  "disponible": true
}
```

---

## 🔒 Rate Limiting

La API tiene rate limiting configurado:
- **Límite:** 100 requests por hora por API Key
- **Header de respuesta:** `X-RateLimit-Remaining` muestra requests restantes

---

## 📝 Códigos de Estado

| Código | Descripción |
|--------|-------------|
| `200` | OK - Request exitoso |
| `401` | Unauthorized - API Key inválida o faltante |
| `403` | Forbidden - API Key desactivada o expirada |
| `404` | Not Found - Recurso no encontrado |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Error del servidor |

---

## 💻 Ejemplos de Uso

### cURL

```bash
curl -X GET "http://localhost:5000/api/PublicApi/libros" \
  -H "X-API-Key: tu-api-key-aqui"
```

### JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:5000/api/PublicApi/libros', {
  headers: {
    'X-API-Key': 'tu-api-key-aqui'
  }
});

const libros = await response.json();
console.log(libros);
```

### Python (Requests)

```python
import requests

headers = {
    'X-API-Key': 'tu-api-key-aqui'
}

response = requests.get(
    'http://localhost:5000/api/PublicApi/libros',
    headers=headers
)

libros = response.json()
print(libros)
```

---

## 🔗 Más Información

- [Configuración de API](../guides/api-setup.md)
- [Endpoints Completos](endpoints.md)

