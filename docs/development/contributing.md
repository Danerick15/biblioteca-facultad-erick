# 🚀 Guía de Desarrollo - Biblioteca FISI Backend

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Cómo Implementar Nuevas Funcionalidades](#cómo-implementar-nuevas-funcionalidades)
4. [Patrones y Convenciones](#patrones-y-convenciones)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

Esta guía te ayudará a entender cómo funciona la arquitectura del backend de Biblioteca FISI y cómo implementar nuevas funcionalidades siguiendo los patrones establecidos.

### **¿Qué es este sistema?**
- **Sistema de gestión de biblioteca** para la Facultad de Ingeniería de Sistemas e Informática
- **Arquitectura modular** con separación clara de responsabilidades
- **API REST** con autenticación y autorización por roles
- **Base de datos SQL Server** con ADO.NET para acceso a datos

---

## 🏗️ Arquitectura del Sistema

### **Estructura de Capas**

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │   Middleware    │  │   Filters    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Business Logic │  │   Validation    │  │   Services   │ │
│  │   (Business/)   │  │   (Business/)   │  │  (Business/) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Repository    │  │   Data Access   │  │   Entities   │ │
│  │   (Data/)       │  │   (ADO.NET)     │  │ (Entities/)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   SQL Server    │  │   Stored Procs  │  │   Views      │ │
│  │   Database      │  │   (Opcional)    │  │ (Opcional)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Responsabilidades por Capa**

| **Capa** | **Responsabilidad** | **Ubicación** | **¿Qué hace?** |
|----------|-------------------|---------------|-----------------|
| **🌐 Controllers** | Manejo de HTTP | `Controllers/` | Recibe peticiones, valida entrada, devuelve respuestas |
| **🧠 Business** | Lógica de negocio | `Business/` | Aplica reglas de negocio, validaciones complejas |
| **💾 Data** | Acceso a datos | `Data/` | Ejecuta consultas SQL, maneja conexiones |
| **📋 Interfaces** | Contratos | `Interfaces/` | Define qué métodos debe implementar cada clase |
| **📦 Models** | Estructuras de datos | `Models/` | Define cómo se ven los datos |

---

## 🛠️ Cómo Implementar Nuevas Funcionalidades

### **Paso 1: Planificar la Funcionalidad**

Antes de escribir código, define:
- **¿Qué hace?** - Descripción clara de la funcionalidad
- **¿Qué datos necesita?** - Entrada y salida
- **¿Qué reglas de negocio aplica?** - Validaciones y lógica
- **¿Quién puede usarla?** - Roles y permisos

### **Paso 2: Crear la Entidad (Si es nueva)**

Si necesitas una nueva tabla en la base de datos:

```csharp
// Models/Entities/NuevaEntidad.cs
using System.ComponentModel.DataAnnotations;

namespace NeoLibroAPI.Models.Entities
{
    public class NuevaEntidad
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;
        
        public string? Descripcion { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        
        public bool Activo { get; set; } = true;
    }
}
```

### **Paso 3: Crear el Repository**

```csharp
// Interfaces/INuevaEntidadRepository.cs
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    public interface INuevaEntidadRepository
    {
        List<NuevaEntidad> Listar();
        NuevaEntidad? ObtenerPorId(int id);
        bool Crear(NuevaEntidad entidad);
        bool Modificar(NuevaEntidad entidad);
        bool Eliminar(int id);
    }
}
```

```csharp
// Data/NuevaEntidadRepository.cs
using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    public class NuevaEntidadRepository : INuevaEntidadRepository
    {
        private readonly string _cadenaConexion;

        public NuevaEntidadRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<NuevaEntidad> Listar()
        {
            var lista = new List<NuevaEntidad>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT Id, Nombre, Descripcion, FechaCreacion, Activo
                    FROM NuevaEntidad 
                    WHERE Activo = 1
                    ORDER BY Nombre", cn);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new NuevaEntidad
                        {
                            Id = Convert.ToInt32(dr["Id"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Descripcion = dr["Descripcion"]?.ToString(),
                            FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                            Activo = Convert.ToBoolean(dr["Activo"])
                        });
                    }
                }
            }

            return lista;
        }

        public NuevaEntidad? ObtenerPorId(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT Id, Nombre, Descripcion, FechaCreacion, Activo
                    FROM NuevaEntidad 
                    WHERE Id = @Id AND Activo = 1", cn);
                cmd.Parameters.AddWithValue("@Id", id);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new NuevaEntidad
                        {
                            Id = Convert.ToInt32(dr["Id"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Descripcion = dr["Descripcion"]?.ToString(),
                            FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                            Activo = Convert.ToBoolean(dr["Activo"])
                        };
                    }
                }
            }

            return null;
        }

        public bool Crear(NuevaEntidad entidad)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    INSERT INTO NuevaEntidad (Nombre, Descripcion, FechaCreacion, Activo)
                    VALUES (@Nombre, @Descripcion, @FechaCreacion, @Activo)", cn);
                
                cmd.Parameters.AddWithValue("@Nombre", entidad.Nombre);
                cmd.Parameters.AddWithValue("@Descripcion", (object?)entidad.Descripcion ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@FechaCreacion", entidad.FechaCreacion);
                cmd.Parameters.AddWithValue("@Activo", entidad.Activo);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Modificar(NuevaEntidad entidad)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE NuevaEntidad 
                    SET Nombre = @Nombre, Descripcion = @Descripcion
                    WHERE Id = @Id", cn);
                
                cmd.Parameters.AddWithValue("@Id", entidad.Id);
                cmd.Parameters.AddWithValue("@Nombre", entidad.Nombre);
                cmd.Parameters.AddWithValue("@Descripcion", (object?)entidad.Descripcion ?? DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE NuevaEntidad 
                    SET Activo = 0
                    WHERE Id = @Id", cn);
                cmd.Parameters.AddWithValue("@Id", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
```

### **Paso 4: Crear el Business Service**

```csharp
// Interfaces/INuevaEntidadBusiness.cs
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    public interface INuevaEntidadBusiness
    {
        List<NuevaEntidad> Listar();
        NuevaEntidad? ObtenerPorId(int id);
        bool Crear(NuevaEntidad entidad);
        bool Modificar(NuevaEntidad entidad);
        bool Eliminar(int id);
    }
}
```

```csharp
// Business/NuevaEntidadBusiness.cs
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    public class NuevaEntidadBusiness : INuevaEntidadBusiness
    {
        private readonly INuevaEntidadRepository _repository;

        public NuevaEntidadBusiness(INuevaEntidadRepository repository)
        {
            _repository = repository;
        }

        public List<NuevaEntidad> Listar()
        {
            return _repository.Listar();
        }

        public NuevaEntidad? ObtenerPorId(int id)
        {
            return _repository.ObtenerPorId(id);
        }

        public bool Crear(NuevaEntidad entidad)
        {
            // Validaciones de negocio
            if (entidad == null)
                return false;

            if (string.IsNullOrWhiteSpace(entidad.Nombre))
                return false;

            if (entidad.Nombre.Length > 100)
                return false;

            // Aplicar reglas de negocio
            entidad.FechaCreacion = DateTime.Now;
            entidad.Activo = true;

            return _repository.Crear(entidad);
        }

        public bool Modificar(NuevaEntidad entidad)
        {
            // Validaciones de negocio
            if (entidad == null)
                return false;

            if (entidad.Id <= 0)
                return false;

            if (string.IsNullOrWhiteSpace(entidad.Nombre))
                return false;

            // Verificar que existe
            var entidadExistente = _repository.ObtenerPorId(entidad.Id);
            if (entidadExistente == null)
                return false;

            return _repository.Modificar(entidad);
        }

        public bool Eliminar(int id)
        {
            // Validaciones de negocio
            if (id <= 0)
                return false;

            // Verificar que existe
            var entidad = _repository.ObtenerPorId(id);
            if (entidad == null)
                return false;

            return _repository.Eliminar(id);
        }
    }
}
```

### **Paso 5: Crear el Controller**

```csharp
// Controllers/NuevaEntidadController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NuevaEntidadController : ControllerBase
    {
        private readonly INuevaEntidadBusiness _business;

        public NuevaEntidadController(INuevaEntidadBusiness business)
        {
            _business = business;
        }

        // GET: api/NuevaEntidad
        [HttpGet]
        public IActionResult Listar()
        {
            var lista = _business.Listar();
            return Ok(lista);
        }

        // GET: api/NuevaEntidad/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var entidad = _business.ObtenerPorId(id);
            if (entidad == null)
                return NotFound(new { mensaje = "Entidad no encontrada" });

            return Ok(entidad);
        }

        // POST: api/NuevaEntidad
        [HttpPost]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Crear([FromBody] NuevaEntidad entidad)
        {
            var resultado = _business.Crear(entidad);
            return resultado
                ? Ok(new { mensaje = "Entidad creada correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear la entidad" });
        }

        // PUT: api/NuevaEntidad/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Modificar(int id, [FromBody] NuevaEntidad entidad)
        {
            if (id != entidad.Id)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _business.Modificar(entidad);
            return resultado
                ? Ok(new { mensaje = "Entidad modificada correctamente" })
                : BadRequest(new { mensaje = "No se pudo modificar la entidad" });
        }

        // DELETE: api/NuevaEntidad/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _business.Eliminar(id);
            return resultado
                ? Ok(new { mensaje = "Entidad eliminada correctamente" })
                : BadRequest(new { mensaje = "No se pudo eliminar la entidad" });
        }
    }
}
```

### **Paso 6: Registrar en Program.cs**

```csharp
// Program.cs - Agregar estas líneas en la sección de registro de servicios

// Registrar servicios NUEVOS con interfaces (MÓDULO NUEVA ENTIDAD)
builder.Services.AddScoped<INuevaEntidadRepository>(provider => 
    new NuevaEntidadRepository(connectionString));
builder.Services.AddScoped<INuevaEntidadBusiness, NuevaEntidadBusiness>();
```

### **Paso 7: Crear la Tabla en la Base de Datos**

```sql
-- Script SQL para crear la tabla
CREATE TABLE NuevaEntidad (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    Activo BIT NOT NULL DEFAULT 1
);

-- Índices para optimizar consultas
CREATE INDEX IX_NuevaEntidad_Activo ON NuevaEntidad(Activo);
CREATE INDEX IX_NuevaEntidad_Nombre ON NuevaEntidad(Nombre);
```

### **Paso 8: Probar la Funcionalidad**

1. **Compilar el proyecto**:
   ```bash
   dotnet build
   ```

2. **Ejecutar el proyecto**:
   ```bash
   dotnet run
   ```

3. **Probar en Swagger**:
   - Ir a `http://localhost:5180/swagger`
   - Probar los endpoints de `NuevaEntidad`

4. **Probar con Postman**:
   ```bash
   # GET - Listar
   GET http://localhost:5180/api/NuevaEntidad
   
   # POST - Crear
   POST http://localhost:5180/api/NuevaEntidad
   {
     "nombre": "Ejemplo",
     "descripcion": "Descripción de ejemplo"
   }
   ```

---

## 📋 Patrones y Convenciones

### **Naming Conventions**

| **Tipo** | **Convención** | **Ejemplo** |
|----------|---------------|-------------|
| **Interfaces** | `I[Nombre]Repository`, `I[Nombre]Business` | `IUsuarioRepository`, `IUsuarioBusiness` |
| **Implementaciones** | `[Nombre]Repository`, `[Nombre]Business` | `UsuarioRepository`, `UsuarioBusiness` |
| **Entidades** | `[Nombre]` (singular) | `Usuario`, `Libro`, `Prestamo` |
| **DTOs** | `[Nombre]DTO` | `LibroDTO`, `PrestamoDTO` |
| **Requests** | `[Nombre]Request` | `LoginRequest`, `CrearPrestamoRequest` |
| **Controllers** | `[Nombre]Controller` | `UsuariosController`, `LibrosController` |

### **Estructura de Archivos**

```
📁 Para cada módulo:
├── Interfaces/
│   ├── I[Nombre]Repository.cs
│   └── I[Nombre]Business.cs
├── Data/
│   └── [Nombre]Repository.cs
├── Business/
│   └── [Nombre]Business.cs
├── Controllers/
│   └── [Nombre]Controller.cs
└── Models/
    ├── Entities/
    │   └── [Nombre].cs
    ├── DTOs/
    │   └── [Nombre]DTO.cs (si es necesario)
    └── Requests/
        └── [Nombre]Request.cs (si es necesario)
```

### **Patrones de Código**

#### **Repository Pattern**
```csharp
// Siempre usar using para conexiones
using (var cn = GetConnection())
{
    // Código de acceso a datos
}

// Siempre manejar parámetros SQL
cmd.Parameters.AddWithValue("@Parametro", valor);

// Siempre verificar DBNull
dr["Campo"]?.ToString() ?? ""
```

#### **Business Pattern**
```csharp
// Siempre validar entrada
if (entidad == null) return false;
if (string.IsNullOrWhiteSpace(entidad.Nombre)) return false;

// Siempre verificar existencia antes de modificar/eliminar
var entidadExistente = _repository.ObtenerPorId(id);
if (entidadExistente == null) return false;
```

#### **Controller Pattern**
```csharp
// Siempre usar inyección de dependencias
private readonly I[Nombre]Business _business;

// Siempre manejar respuestas HTTP apropiadas
return resultado ? Ok() : BadRequest();

// Siempre usar autorización cuando sea necesario
[Authorize(Roles = "Bibliotecaria,Administrador")]
```

---

## 🧪 Testing

### **Unit Tests**

```csharp
// Tests/Business/NuevaEntidadBusinessTests.cs
using Moq;
using NeoLibroAPI.Business;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Tests.Business
{
    [TestClass]
    public class NuevaEntidadBusinessTests
    {
        private Mock<INuevaEntidadRepository> _mockRepository;
        private NuevaEntidadBusiness _business;

        [TestInitialize]
        public void Setup()
        {
            _mockRepository = new Mock<INuevaEntidadRepository>();
            _business = new NuevaEntidadBusiness(_mockRepository.Object);
        }

        [TestMethod]
        public void Crear_ConEntidadValida_RetornaTrue()
        {
            // Arrange
            var entidad = new NuevaEntidad { Nombre = "Test" };
            _mockRepository.Setup(r => r.Crear(It.IsAny<NuevaEntidad>())).Returns(true);

            // Act
            var resultado = _business.Crear(entidad);

            // Assert
            Assert.IsTrue(resultado);
            _mockRepository.Verify(r => r.Crear(It.IsAny<NuevaEntidad>()), Times.Once);
        }

        [TestMethod]
        public void Crear_ConNombreVacio_RetornaFalse()
        {
            // Arrange
            var entidad = new NuevaEntidad { Nombre = "" };

            // Act
            var resultado = _business.Crear(entidad);

            // Assert
            Assert.IsFalse(resultado);
            _mockRepository.Verify(r => r.Crear(It.IsAny<NuevaEntidad>()), Times.Never);
        }
    }
}
```

### **Integration Tests**

```csharp
// Tests/Integration/NuevaEntidadControllerTests.cs
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http.Json;

namespace NeoLibroAPI.Tests.Integration
{
    [TestClass]
    public class NuevaEntidadControllerTests
    {
        private WebApplicationFactory<Program> _factory;
        private HttpClient _client;

        [TestInitialize]
        public void Setup()
        {
            _factory = new WebApplicationFactory<Program>();
            _client = _factory.CreateClient();
        }

        [TestMethod]
        public async Task Get_Listar_RetornaLista()
        {
            // Act
            var response = await _client.GetAsync("/api/NuevaEntidad");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            Assert.IsNotNull(content);
        }
    }
}
```

---

## 🔧 Troubleshooting

### **Problemas Comunes**

#### **Error: "No se puede resolver el servicio"**
```csharp
// ❌ Error: No se registró el servicio
// ✅ Solución: Agregar en Program.cs
builder.Services.AddScoped<INuevaEntidadRepository>(provider => 
    new NuevaEntidadRepository(connectionString));
builder.Services.AddScoped<INuevaEntidadBusiness, NuevaEntidadBusiness>();
```

#### **Error: "No se encuentra el tipo"**
```csharp
// ❌ Error: Falta using
// ✅ Solución: Agregar using
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;
```

#### **Error: "Violación de clave primaria"**
```csharp
// ❌ Error: ID duplicado
// ✅ Solución: Verificar que la tabla tenga IDENTITY
CREATE TABLE NuevaEntidad (
    Id INT IDENTITY(1,1) PRIMARY KEY, -- ✅ IDENTITY
    -- otros campos
);
```

#### **Error: "Referencia nula"**
```csharp
// ❌ Error: No verificar null
// ✅ Solución: Siempre verificar
if (entidad == null) return false;
if (string.IsNullOrWhiteSpace(entidad.Nombre)) return false;
```

### **Debugging Tips**

1. **Usar breakpoints** en Visual Studio
2. **Revisar logs** en la consola
3. **Probar endpoints** en Swagger
4. **Verificar base de datos** con SQL Server Management Studio
5. **Revisar configuración** en `appsettings.json`

---

## ✅ Mejores Prácticas

### **Código Limpio**
- ✅ **Nombres descriptivos** para variables y métodos
- ✅ **Métodos pequeños** con una sola responsabilidad
- ✅ **Comentarios útiles** explicando lógica compleja
- ✅ **Consistencia** en el estilo de código

### **Seguridad**
- ✅ **Validar entrada** en todos los endpoints
- ✅ **Usar autorización** para endpoints sensibles
- ✅ **Sanitizar parámetros SQL** para evitar inyección
- ✅ **Manejar errores** sin exponer información sensible

### **Performance**
- ✅ **Usar using** para conexiones de base de datos
- ✅ **Crear índices** en campos de búsqueda frecuente
- ✅ **Paginación** para listas grandes
- ✅ **Caching** para datos que no cambian frecuentemente

### **Mantenibilidad**
- ✅ **Separar responsabilidades** por capas
- ✅ **Usar interfaces** para desacoplar código
- ✅ **Escribir tests** para funcionalidad crítica
- ✅ **Documentar** APIs y lógica compleja

---

## 📚 Recursos Adicionales

### **Documentación**
- [ARQUITECTURA.md](./ARQUITECTURA.md) - Arquitectura detallada del sistema
- [MIGRACION.md](./MIGRACION.md) - Historial de migración
- [PRUEBAS_INTEGRACION.md](./PRUEBAS_INTEGRACION.md) - Guía de pruebas

### **Herramientas**
- **Visual Studio** - IDE principal
- **SQL Server Management Studio** - Gestión de base de datos
- **Postman** - Pruebas de API
- **Swagger** - Documentación de API

### **Tecnologías**
- **.NET 9** - Framework principal
- **ASP.NET Core** - Web API
- **ADO.NET** - Acceso a datos
- **SQL Server** - Base de datos
- **Entity Framework** - (Opcional para futuras mejoras)

---

**📅 Última actualización:** 14/10/2025  
**👨‍💻 Desarrollador:** Sistema Biblioteca FISI  
**📋 Versión:** 1.0 - Guía de Desarrollo
