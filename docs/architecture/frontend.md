# 🏗️ Arquitectura Frontend - Biblioteca FISI

## 📋 **Resumen Ejecutivo**

Este documento describe la arquitectura del frontend de la Biblioteca FISI, implementada con **Feature-Based Architecture** para maximizar la escalabilidad, mantenibilidad y organización del código.

---

## 🎯 **Arquitectura Implementada**

### **Feature-Based Architecture**
- **Organización por dominio funcional** en lugar de por tipo de archivo
- **Separación clara de responsabilidades** entre features
- **Escalabilidad ilimitada** para nuevos módulos
- **Mantenimiento simplificado** con código relacionado agrupado

---

## 📁 **Estructura de Carpetas**

```
src/
├── core/                           # Funcionalidades centrales
│   ├── api/                        # Clientes API
│   │   ├── auth.ts
│   │   ├── libros.ts
│   │   ├── autores.ts
│   │   └── categorias.ts
│   ├── types/                      # Tipos TypeScript globales
│   │   └── common.types.ts
│   ├── constants/                  # Constantes globales
│   │   ├── routes.constants.ts
│   │   ├── user-roles.constants.ts
│   │   └── api.constants.ts
│   ├── utils/                      # Utilidades globales
│   │   └── axiosInterceptor.ts
│   └── config/                     # Configuraciones
│       └── vite.config.ts
│
├── shared/                         # Componentes y utilidades compartidas
│   ├── components/                 # Componentes reutilizables
│   │   ├── ui/                     # Componentes de UI básicos
│   │   │   ├── HeroCarrusel.tsx
│   │   │   └── HeroCarrusel.css
│   │   ├── layout/                 # Componentes de layout
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.css
│   │   └── feedback/               # Componentes de feedback
│   │       ├── PageLoader.tsx
│   │       └── PageLoader.css
│   ├── hooks/                      # Hooks personalizados
│   │   ├── useAuth.ts
│   │   ├── useSEO.ts
│   │   └── useNavigation.ts
│   ├── styles/                     # Estilos globales
│   │   ├── variables.css
│   │   ├── buttons.css
│   │   └── modals.css
│   └── utils/                      # Utilidades compartidas
│       └── helpers.ts
│
├── features/                       # Módulos por funcionalidad
│   ├── auth/                       # Módulo de autenticación
│   │   ├── components/             # Componentes específicos de auth
│   │   ├── hooks/                  # Hooks específicos de auth
│   │   ├── services/               # Servicios de auth
│   │   ├── types/                  # Tipos de auth
│   │   └── pages/                  # Páginas de auth
│   │       ├── Login/
│   │       │   ├── Login.tsx
│   │       │   └── Login.css
│   │       └── Register/
│   │           ├── Register.tsx
│   │           └── Register.css
│   │
│   ├── admin/                      # Módulo de administración
│   │   ├── books/                  # Gestión de libros
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── pages/
│   │   │       └── AdminBooks/
│   │   │           ├── AdminBooks.tsx
│   │   │           └── AdminBooks.css
│   │   ├── authors/                # Gestión de autores
│   │   ├── categories/             # Gestión de categorías
│   │   └── copies/                 # Gestión de ejemplares
│   │
│   ├── catalog/                    # Módulo de catálogo
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── pages/
│   │       └── Catalog/
│   │           ├── Catalog.tsx
│   │           └── Catalog.css
│   │
│   ├── profile/                    # Módulo de perfil
│   ├── loans/                      # Módulo de préstamos
│   ├── fines/                      # Módulo de multas
│   └── notifications/              # Módulo de notificaciones
│
├── app/                           # Configuración de la aplicación
│   ├── providers/                 # Proveedores de contexto
│   │   └── AuthProvider.tsx
│   └── router/                    # Configuración de rutas
│       └── AppRouter.tsx
│
└── pages/                         # Páginas legacy (en migración)
    ├── Dashboard.tsx
    ├── Perfil.tsx
    ├── MisPrestamos.tsx
    └── ...
```

---

## 🔧 **Tecnologías y Herramientas**

### **Core Technologies**
- **React 19** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router DOM** - Enrutamiento

### **UI/UX**
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Iconografía
- **Framer Motion** - Animaciones
- **CSS Modules** - Estilos encapsulados

### **State Management**
- **React Context API** - Estado global
- **Custom Hooks** - Lógica reutilizable
- **LocalStorage/SessionStorage** - Persistencia

### **API Integration**
- **Axios** - Cliente HTTP
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### **Development Tools**
- **ESLint** - Linting
- **Prettier** - Formateo de código
- **TypeScript** - Verificación de tipos

---

## 🚀 **Principios de Diseño**

### **1. Separación de Responsabilidades**
- **Core**: Funcionalidades centrales y compartidas
- **Shared**: Componentes y utilidades reutilizables
- **Features**: Módulos específicos por funcionalidad
- **App**: Configuración y setup de la aplicación

### **2. Encapsulación**
- Cada feature es independiente
- Imports relativos dentro del feature
- APIs claras entre módulos
- Estilos encapsulados por componente

### **3. Reutilización**
- Componentes UI compartidos
- Hooks personalizados reutilizables
- Servicios API centralizados
- Utilidades comunes

### **4. Escalabilidad**
- Fácil adición de nuevas features
- Estructura predecible
- Separación clara de concerns
- Testing independiente por módulo

---

## 📋 **Guía de Desarrollo**

### **Agregar Nueva Feature**

1. **Crear estructura de carpetas**:
```bash
src/features/nueva-feature/
├── components/
├── hooks/
├── services/
├── types/
└── pages/
    └── NuevaPagina/
        ├── NuevaPagina.tsx
        └── NuevaPagina.css
```

2. **Definir tipos**:
```typescript
// src/features/nueva-feature/types/index.ts
export interface NuevaFeatureData {
  id: number;
  nombre: string;
}
```

3. **Crear servicios**:
```typescript
// src/features/nueva-feature/services/api.ts
import { api } from '../../../core/api';
import { NuevaFeatureData } from '../types';

export const obtenerDatos = async (): Promise<NuevaFeatureData[]> => {
  const response = await api.get('/nueva-feature');
  return response.data;
};
```

4. **Crear componentes**:
```typescript
// src/features/nueva-feature/pages/NuevaPagina/NuevaPagina.tsx
import React from 'react';
import { useSEO } from '../../../shared/hooks/useSEO';
import './NuevaPagina.css';

const NuevaPagina: React.FC = () => {
  useSEO({
    title: "Nueva Página - Biblioteca FISI",
    description: "Descripción de la nueva página"
  });

  return (
    <div className="nueva-pagina">
      <h1>Nueva Página</h1>
    </div>
  );
};

export default NuevaPagina;
```

5. **Agregar rutas**:
```typescript
// src/App.tsx
const NuevaPagina = lazy(() => import("./features/nueva-feature/pages/NuevaPagina/NuevaPagina"));

// En las rutas
<Route
  path="nueva-pagina"
  element={
    <Suspense fallback={<LoadingSpinner message="Cargando..." />}>
      <NuevaPagina />
    </Suspense>
  }
/>
```

### **Convenciones de Nomenclatura**

- **Archivos**: PascalCase para componentes, camelCase para utilidades
- **Carpetas**: kebab-case para features, camelCase para otros
- **Componentes**: PascalCase con sufijo descriptivo
- **Hooks**: camelCase con prefijo "use"
- **Servicios**: camelCase con sufijo descriptivo

### **Estructura de Componentes**

```typescript
// Estructura estándar de componente
import React, { useState, useEffect } from 'react';
import { useSEO } from '../../../shared/hooks/useSEO';
import PageLoader from '../../../shared/components/feedback/PageLoader';
import './Componente.css';

interface ComponenteProps {
  // Props del componente
}

const Componente: React.FC<ComponenteProps> = ({ }) => {
  // SEO
  useSEO({
    title: "Título - Biblioteca FISI",
    description: "Descripción"
  });

  // Estados
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efectos
  useEffect(() => {
    // Lógica de inicialización
  }, []);

  // Handlers
  const manejarAccion = () => {
    // Lógica del handler
  };

  // Render condicional
  if (cargando) {
    return <PageLoader message="Cargando..." />;
  }

  // Render principal
  return (
    <div className="componente">
      {/* Contenido */}
    </div>
  );
};

export default Componente;
```

---

## 🔄 **Migración de Legacy**

### **Estado Actual**
- ✅ **Auth**: Login y Register migrados
- ✅ **Admin Books**: AdminBooks migrado
- ✅ **Catalog**: Catalog migrado
- 🔄 **Dashboard**: En proceso
- 🔄 **Profile**: En proceso
- 🔄 **Loans**: En proceso
- 🔄 **Fines**: En proceso
- 🔄 **Notifications**: En proceso

### **Plan de Migración**

1. **Fase 1**: Core y Shared (✅ Completado)
2. **Fase 2**: Auth y Admin (✅ Completado)
3. **Fase 3**: Catalog (✅ Completado)
4. **Fase 4**: Dashboard y Profile (🔄 En proceso)
5. **Fase 5**: Loans, Fines, Notifications (⏳ Pendiente)
6. **Fase 6**: Limpieza y optimización (⏳ Pendiente)

---

## 🧪 **Testing Strategy**

### **Estructura de Tests**
```
src/
├── features/
│   └── auth/
│       ├── __tests__/
│       │   ├── Login.test.tsx
│       │   └── Register.test.tsx
│       └── components/
└── shared/
    └── components/
        └── __tests__/
            └── PageLoader.test.tsx
```

### **Tipos de Testing**
- **Unit Tests**: Componentes individuales
- **Integration Tests**: Features completas
- **E2E Tests**: Flujos de usuario
- **Visual Tests**: Regresiones visuales

---

## 📊 **Métricas y Performance**

### **Bundle Analysis**
- **Code Splitting**: Por feature y página
- **Lazy Loading**: Componentes bajo demanda
- **Tree Shaking**: Eliminación de código no usado
- **Compression**: Gzip y Brotli

### **Performance Metrics**
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

---

## 🔒 **Seguridad**

### **Mejores Prácticas**
- **Input Validation**: Validación en frontend y backend
- **XSS Protection**: Sanitización de inputs
- **CSRF Protection**: Tokens de seguridad
- **Content Security Policy**: Headers de seguridad
- **Authentication**: JWT con refresh tokens

---

## 📚 **Recursos y Referencias**

### **Documentación**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)

### **Arquitectura**
- [Feature-Based Architecture](https://martinfowler.com/articles/feature-toggles.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

## 👥 **Equipo y Contacto**

- **Arquitecto Frontend**: [Tu nombre]
- **Desarrolladores**: [Equipo]
- **Fecha de creación**: [Fecha]
- **Última actualización**: [Fecha]

---

*Este documento se actualiza regularmente para reflejar los cambios en la arquitectura del frontend.*

