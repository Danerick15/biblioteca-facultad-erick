# 🔌 Configuración de API Pública

Guía para configurar y usar la API pública del sistema con autenticación por API Key.

---

## 📋 Descripción

La API pública permite acceso a recursos del sistema mediante autenticación por API Key, ideal para integraciones externas y aplicaciones de terceros.

---

## 🔑 Crear API Key

### Desde la Aplicación Web

1. Inicia sesión como **Administrador**
2. Ve a la sección de **API Keys** (si está disponible en el frontend)
3. Crea una nueva API Key
4. **Guarda la clave** - solo se mostrará una vez

### Desde la Base de Datos

```sql
-- Insertar nueva API Key
INSERT INTO ApiKeys (ApiKey, Nombre, Activa, FechaCreacion, FechaExpiracion)
VALUES (
    NEWID(), -- Genera un GUID único
    'Mi Aplicación',
    1, -- Activa
    GETDATE(),
    DATEADD(YEAR, 1, GETDATE()) -- Expira en 1 año
);

-- Obtener la API Key creada
SELECT ApiKey, Nombre, FechaCreacion, FechaExpiracion
FROM ApiKeys
WHERE Nombre = 'Mi Aplicación';
```

---

## 🔧 Configuración

### Rate Limiting

El sistema incluye rate limiting para proteger la API. Configuración en `Program.cs`:

```csharp
// Límite por defecto: 100 requests por hora por API Key
```

### Endpoints Públicos

Los endpoints públicos están disponibles en:
- Base URL: `http://localhost:5000/api/PublicApi`

---

## 📡 Uso de la API

### Autenticación

Incluye la API Key en el header de cada request:

```http
GET /api/PublicApi/libros HTTP/1.1
Host: localhost:5000
X-API-Key: tu-api-key-aqui
```

### Ejemplo con cURL

```bash
curl -X GET "http://localhost:5000/api/PublicApi/libros" \
  -H "X-API-Key: tu-api-key-aqui"
```

### Ejemplo con JavaScript

```javascript
const response = await fetch('http://localhost:5000/api/PublicApi/libros', {
  headers: {
    'X-API-Key': 'tu-api-key-aqui'
  }
});

const libros = await response.json();
```

### Ejemplo con Python

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
```

---

## 📚 Endpoints Disponibles

### Obtener Libros

```http
GET /api/PublicApi/libros
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
    "categoria": "Categoría"
  }
]
```

### Obtener Libro por ID

```http
GET /api/PublicApi/libros/{id}
```

---

## 🔒 Seguridad

- ✅ API Keys se almacenan como GUIDs únicos
- ✅ Rate limiting previene abuso
- ✅ Validación de API Key en cada request
- ✅ Logs de acceso para auditoría

---

## 🆘 Troubleshooting

### Error 401: Unauthorized

- Verifica que la API Key sea correcta
- Asegúrate de incluir el header `X-API-Key`
- Verifica que la API Key esté activa

### Error 429: Too Many Requests

- Has excedido el límite de rate limiting
- Espera antes de hacer más requests
- Considera implementar caching en tu aplicación

### Error 403: Forbidden

- La API Key puede estar desactivada
- La API Key puede haber expirado
- Verifica en la base de datos el estado de la clave

---

## 📖 Documentación Completa

Para ver todos los endpoints disponibles, accede a:
- Swagger UI: `http://localhost:5000/swagger`
- Busca la sección `PublicApi`

---

## 🔗 Referencias

- [Documentación de API Pública](../api/public-api.md)
- [Endpoints Completos](../api/endpoints.md)

