# 🧪 Guía de Pruebas - HU-14: Recomendaciones de Profesores

## 📋 Índice
1. [Preparación del Entorno](#preparación-del-entorno)
2. [Pruebas del Backend](#pruebas-del-backend)
3. [Pruebas del Frontend](#pruebas-del-frontend)
4. [Casos de Prueba Específicos](#casos-de-prueba-específicos)
5. [Verificación de Integración](#verificación-de-integración)

---

## 🔧 Preparación del Entorno

### 1. Verificar que el Backend compile correctamente

```bash
cd backend/NeoLibro.WebAPI
dotnet restore
dotnet build
```

**✅ Resultado esperado:** Compilación exitosa sin errores

### 2. Verificar que el Frontend compile correctamente

```bash
cd frontend/frontend
npm install
npm run build
```

**✅ Resultado esperado:** Compilación exitosa sin errores

---

## 🔌 Pruebas del Backend

### Paso 1: Iniciar el Backend

```bash
cd backend/NeoLibro.WebAPI
dotnet run
```

**✅ Verificar:**
- El servidor inicia en `http://localhost:5180`
- Swagger está disponible en `http://localhost:5180/swagger`
- No hay errores en la consola

### Paso 2: Verificar que los endpoints de Recomendaciones aparecen en Swagger

1. Abrir `http://localhost:5180/swagger`
2. Buscar la sección **"Recomendaciones"**
3. Verificar que aparezcan estos endpoints:
   - `GET /api/Recomendaciones/publicas`
   - `GET /api/Recomendaciones/mis-recomendaciones`
   - `GET /api/Recomendaciones/{id}`
   - `POST /api/Recomendaciones`
   - `PUT /api/Recomendaciones/{id}`
   - `DELETE /api/Recomendaciones/{id}`

**✅ Resultado esperado:** Todos los endpoints están visibles en Swagger

### Paso 3: Probar Endpoint Público (sin autenticación)

```bash
# Probar obtener recomendaciones públicas
curl http://localhost:5180/api/Recomendaciones/publicas
```

**✅ Resultado esperado:** 
- Status 200 OK
- Respuesta JSON con array de recomendaciones (puede estar vacío si no hay datos)

### Paso 4: Probar Búsqueda Mejorada de Libros

```bash
# Probar búsqueda por palabra clave
curl "http://localhost:5180/api/Libros/buscar?palabraClave=MATEMATICA"

# Probar búsqueda combinada
curl "http://localhost:5180/api/Libros/buscar?titulo=LOGICA&palabraClave=MATEMATICA"
```

**✅ Resultado esperado:**
- Status 200 OK
- Respuesta JSON con libros que coinciden con la búsqueda

---

## 🎨 Pruebas del Frontend

### Paso 1: Iniciar el Frontend

```bash
cd frontend/frontend
npm run dev
```

**✅ Verificar:**
- El servidor inicia en `http://localhost:5173`
- No hay errores en la consola del navegador

### Paso 2: Verificar que la aplicación carga correctamente

1. Abrir `http://localhost:5173`
2. Iniciar sesión con un usuario (cualquier rol)

**✅ Resultado esperado:** 
- La aplicación carga sin errores
- El dashboard se muestra correctamente

---

## 🧪 Casos de Prueba Específicos

### Caso 1: Verificar Acceso a Recomendaciones para Profesores

**Prerrequisitos:**
- Tener un usuario con rol "Profesor" creado en la base de datos
- Estar autenticado como profesor

**Pasos:**
1. Iniciar sesión como profesor
2. Verificar que aparece el botón "Mis Recomendaciones" en QuickActions
3. Hacer clic en "Mis Recomendaciones"
4. Verificar que se carga la página `/profesor/recomendaciones`

**✅ Resultado esperado:**
- El botón aparece en QuickActions
- La página carga sin errores
- Se muestra la interfaz de gestión de recomendaciones

### Caso 2: Crear una Recomendación con Libro del Catálogo

**Pasos:**
1. Ir a `/profesor/recomendaciones`
2. Hacer clic en "Nueva Recomendación"
3. Llenar el formulario:
   - Curso: "Matemáticas I"
   - Buscar libro: escribir "LOGICA" y seleccionar un libro
4. Hacer clic en "Guardar"

**✅ Resultado esperado:**
- El modal se abre correctamente
- La búsqueda de libros funciona
- Se puede seleccionar un libro
- La recomendación se crea exitosamente
- Aparece un mensaje de éxito
- La recomendación aparece en la lista

### Caso 3: Crear una Recomendación con URL Externa

**Pasos:**
1. Ir a `/profesor/recomendaciones`
2. Hacer clic en "Nueva Recomendación"
3. Llenar el formulario:
   - Curso: "Programación Avanzada"
   - URL Externa: "https://www.ejemplo.com/recurso"
4. Hacer clic en "Guardar"

**✅ Resultado esperado:**
- La recomendación se crea exitosamente
- Aparece con el icono de enlace externo
- El enlace es clickeable

### Caso 4: Editar una Recomendación

**Pasos:**
1. Ir a `/profesor/recomendaciones`
2. Hacer clic en el botón de editar (ícono de lápiz) de una recomendación
3. Modificar el curso o cambiar el libro/URL
4. Hacer clic en "Guardar"

**✅ Resultado esperado:**
- El modal se abre con los datos actuales
- Se pueden modificar los campos
- Los cambios se guardan correctamente
- La lista se actualiza

### Caso 5: Eliminar una Recomendación

**Pasos:**
1. Ir a `/profesor/recomendaciones`
2. Hacer clic en el botón de eliminar (ícono de basura) de una recomendación
3. Confirmar la eliminación en el modal

**✅ Resultado esperado:**
- Aparece un modal de confirmación
- Al confirmar, la recomendación se elimina
- Desaparece de la lista
- Aparece un mensaje de éxito

### Caso 6: Ver Recomendaciones en el Catálogo Público

**Prerrequisitos:**
- Debe haber al menos una recomendación creada

**Pasos:**
1. Iniciar sesión como cualquier usuario (Estudiante, Profesor, etc.)
2. Ir a `/catalogo`
3. Desplazarse hacia abajo después del header

**✅ Resultado esperado:**
- Se muestra la sección "Recomendaciones de Profesores"
- Se muestran hasta 6 recomendaciones recientes
- Cada tarjeta muestra:
  - Nombre del curso
  - Nombre del profesor
  - Título del libro o enlace externo
  - Fecha de la recomendación
- Los enlaces externos son clickeables

### Caso 7: Probar Búsqueda Mejorada en el Catálogo

**Pasos:**
1. Ir a `/catalogo`
2. En el campo de búsqueda, escribir una palabra clave (ej: "MATEMATICA")
3. Verificar que se filtran los libros

**✅ Resultado esperado:**
- El placeholder menciona "palabra clave"
- La búsqueda encuentra libros por:
  - Título
  - Autor
  - Categoría
  - Editorial
  - ISBN

### Caso 8: Verificar Seguridad - Profesor no puede ver recomendaciones de otros profesores

**Pasos:**
1. Crear una recomendación con el Profesor A
2. Iniciar sesión con el Profesor B
3. Ir a `/profesor/recomendaciones`

**✅ Resultado esperado:**
- El Profesor B solo ve sus propias recomendaciones
- No puede ver las recomendaciones del Profesor A

### Caso 9: Verificar Seguridad - Solo Profesores pueden crear recomendaciones

**Pasos:**
1. Iniciar sesión como Estudiante
2. Intentar acceder directamente a `/profesor/recomendaciones`

**✅ Resultado esperado:**
- Se redirige o muestra error de acceso denegado
- No se puede acceder a la página

---

## 🔗 Verificación de Integración

### Verificar que todo funciona en conjunto:

1. **Backend ejecutándose:** `http://localhost:5180`
2. **Frontend ejecutándose:** `http://localhost:5173`
3. **Base de datos conectada:** Verificar en logs del backend

### Flujo Completo de Prueba:

1. ✅ Crear recomendación como Profesor
2. ✅ Ver recomendación en el catálogo como Estudiante
3. ✅ Editar recomendación como Profesor
4. ✅ Eliminar recomendación como Profesor
5. ✅ Verificar que desaparece del catálogo público

---

## 🐛 Solución de Problemas Comunes

### Error: "No se puede cargar la página de recomendaciones"

**Solución:**
- Verificar que el backend está ejecutándose
- Verificar la consola del navegador para errores
- Verificar que la ruta está correctamente configurada en `App.tsx`

### Error: "No se pueden crear recomendaciones"

**Solución:**
- Verificar que estás autenticado como Profesor
- Verificar que el curso no esté vacío
- Verificar que hay un libro o URL externa especificada

### Error: "Las recomendaciones no aparecen en el catálogo"

**Solución:**
- Verificar que hay recomendaciones creadas
- Verificar la consola del navegador
- Verificar que el endpoint `/api/Recomendaciones/publicas` funciona

### Error: "La búsqueda por palabra clave no funciona"

**Solución:**
- Verificar que el backend tiene la última versión del código
- Verificar que el endpoint `/api/Libros/buscar?palabraClave=...` funciona en Swagger

---

## ✅ Checklist Final

Antes de considerar que todo funciona:

- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Todos los endpoints aparecen en Swagger
- [ ] Se puede crear una recomendación con libro
- [ ] Se puede crear una recomendación con URL externa
- [ ] Se puede editar una recomendación
- [ ] Se puede eliminar una recomendación
- [ ] Las recomendaciones aparecen en el catálogo público
- [ ] La búsqueda por palabra clave funciona
- [ ] Los permisos de seguridad funcionan correctamente
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en la consola del backend

---

## 📝 Notas Adicionales

- **Datos de prueba:** Puedes crear recomendaciones de prueba usando Swagger o la interfaz
- **Base de datos:** Asegúrate de que la tabla `Recomendaciones` existe y tiene datos
- **Logs:** Revisa los logs del backend para ver errores detallados
- **Consola del navegador:** Usa F12 para ver errores de JavaScript

---

¡Buena suerte con las pruebas! 🚀


