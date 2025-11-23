# 📝 Estándares de Código

Convenciones y mejores prácticas para el desarrollo del proyecto.

---

## 🎯 Principios Generales

- ✅ **Claridad sobre complejidad**
- ✅ **Consistencia en todo el código**
- ✅ **Documentación cuando sea necesario**
- ✅ **Pruebas para funcionalidades críticas**

---

## 🔷 Backend (.NET)

### Convenciones de Nombres

- **Clases:** PascalCase (`LibroBusiness`, `PrestamoRepository`)
- **Métodos:** PascalCase (`ObtenerPorId`, `CrearLibro`)
- **Variables:** camelCase (`libroId`, `fechaPrestamo`)
- **Constantes:** PascalCase (`MAX_PRESTAMOS`)

### Estructura de Archivos

```
Controllers/
  - LibrosController.cs
Business/
  - LibroBusiness.cs
Data/
  - LibroRepository.cs
Models/
  - Libro.cs
  - LibroDTO.cs
```

### Comentarios

```csharp
/// <summary>
/// Obtiene un libro por su ID
/// </summary>
/// <param name="id">ID del libro</param>
/// <returns>Libro encontrado o null</returns>
public Libro? ObtenerPorId(int id)
{
    // Implementación
}
```

---

## ⚛️ Frontend (React/TypeScript)

### Convenciones de Nombres

- **Componentes:** PascalCase (`AdminBooks.tsx`)
- **Funciones:** camelCase (`cargarDatos`, `handleSubmit`)
- **Variables:** camelCase (`libros`, `isLoading`)
- **Constantes:** UPPER_SNAKE_CASE (`API_URL`)

### Estructura de Componentes

```typescript
// 1. Imports
import React, { useState } from 'react';

// 2. Interfaces/Types
interface Props {
  // ...
}

// 3. Componente
const ComponentName: React.FC<Props> = ({ prop }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Funciones
  const handleAction = () => {
    // ...
  };
  
  // 6. Render
  return (
    // JSX
  );
};

export default ComponentName;
```

---

## 📚 Más Información

- [Guía de Contribución](contributing.md)
- [Arquitectura del Backend](../architecture/backend.md)
- [Arquitectura del Frontend](../architecture/frontend.md)

