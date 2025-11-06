using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Models.Requests;
using NeoLibroAPI.Helpers;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrestamosController : ControllerBase
    {
        private readonly IPrestamoBusiness _prestamoBusiness;

        public PrestamosController(IPrestamoBusiness prestamoBusiness)
        {
            _prestamoBusiness = prestamoBusiness;
        }

        // GET: api/Prestamos/activos
        [HttpGet("activos")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult ListarPrestamosActivos()
        {
            var lista = _prestamoBusiness.ListarPrestamosActivos();
            return Ok(lista);
        }

        // GET: api/Prestamos/usuario/{usuarioId}
        [HttpGet("usuario/{usuarioId}")]
        [Authorize]
        public IActionResult ListarPrestamosPorUsuario(int usuarioId)
        {
            // Verificar que el usuario solo pueda ver sus propios préstamos
            var usuarioActualId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var rolUsuario = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            
            if (rolUsuario != "Bibliotecaria" && rolUsuario != "Administrador" && 
                usuarioActualId != usuarioId.ToString())
            {
                return Forbid("No tienes permisos para ver estos préstamos");
            }

            var lista = _prestamoBusiness.ListarPrestamosPorUsuario(usuarioId);
            return Ok(lista);
        }

        // GET: api/Prestamos/atrasados
        [HttpGet("atrasados")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult ListarPrestamosAtrasados()
        {
            var lista = _prestamoBusiness.ListarPrestamosAtrasados();
            return Ok(lista);
        }

        // POST: api/Prestamos
        [HttpPost]
        [Authorize]
        public IActionResult CrearPrestamo([FromBody] CrearPrestamoRequest request)
        {
            if (request == null || request.EjemplarID <= 0)
                return BadRequest(new { mensaje = "EjemplarID es requerido" });

            var usuarioActualIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioActualIdStr) || !int.TryParse(usuarioActualIdStr, out int usuarioActualId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var rol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Si no es staff, solo puede crear préstamos para sí mismo
            if (rol != "Bibliotecaria" && rol != "Administrador")
            {
                if (request.UsuarioID != usuarioActualId)
                    return Forbid("No tienes permisos para crear préstamos para otro usuario");
            }

            // Si el caller no proporcionó UsuarioID (0), usar el ID actual
            var usuarioDestinoId = request.UsuarioID > 0 ? request.UsuarioID : usuarioActualId;

            // Si no se especificó DiasPrestamo o es el valor por defecto, leer de la configuración
            int diasPrestamo = request.DiasPrestamo;
            
            #if DEBUG
            Console.WriteLine($"[CrearPrestamo] DiasPrestamo recibido en request: {diasPrestamo}");
            #endif
            
            if (diasPrestamo <= 0 || diasPrestamo == 15) // 15 es el valor por defecto del request
            {
                // Obtener el rol del usuario destinatario para usar la configuración correcta
                // Necesitamos obtener el rol desde la base de datos
                var usuarioRepository = HttpContext.RequestServices.GetRequiredService<IUsuarioRepository>();
                var usuarioDestino = usuarioRepository.ObtenerPorId(usuarioDestinoId);
                string? rolUsuarioDestino = usuarioDestino?.Rol;
                
                #if DEBUG
                Console.WriteLine($"[CrearPrestamo] Rol del usuario destinatario (ID: {usuarioDestinoId}): '{rolUsuarioDestino}'");
                #endif
                
                // Leer configuración dinámicamente - esto asegura que los cambios en el panel se reflejen inmediatamente
                diasPrestamo = ConfiguracionHelper.ObtenerDiasPrestamoPorRol(rolUsuarioDestino);
                
                #if DEBUG
                Console.WriteLine($"[CrearPrestamo] Días de préstamo calculados desde configuración: {diasPrestamo}");
                #endif
                
                // Validar que los días de préstamo sean válidos
                if (diasPrestamo <= 0)
                {
                    Console.WriteLine($"[CrearPrestamo] WARNING: Días de préstamo inválidos ({diasPrestamo}), usando 3 días por defecto");
                    diasPrestamo = 3; // Valor seguro para estudiantes
                }
            }
            else
            {
                #if DEBUG
                Console.WriteLine($"[CrearPrestamo] Usando días de préstamo especificados explícitamente: {diasPrestamo}");
                #endif
            }

            #if DEBUG
            Console.WriteLine($"[CrearPrestamo] Llamando a CrearPrestamo con: EjemplarID={request.EjemplarID}, UsuarioID={usuarioDestinoId}, DiasPrestamo={diasPrestamo}");
            #endif

            var resultado = _prestamoBusiness.CrearPrestamo(request.EjemplarID, usuarioDestinoId, diasPrestamo);
            return resultado
                ? Ok(new { mensaje = "Préstamo creado correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear el préstamo. Verifique que el ejemplar esté disponible." });
        }

        // PUT: api/Prestamos/{id}/devolucion
        [HttpPut("{id}/devolucion")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult ProcesarDevolucion(int id, [FromBody] DevolucionRequest? request = null)
        {
            var observaciones = request?.Observaciones;

            // Validar existencia del préstamo y su estado antes de intentar procesar
            var prestamo = _prestamoBusiness.ObtenerPorId(id);
            if (prestamo == null)
                return NotFound(new { mensaje = "Préstamo no encontrado" });

            if (!string.Equals(prestamo.Estado, "Prestado", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensaje = $"No se puede procesar la devolución: el préstamo tiene estado '{prestamo.Estado}'" });

            var resultado = _prestamoBusiness.ProcesarDevolucion(id, observaciones);
            return resultado
                ? Ok(new { mensaje = "Devolución procesada correctamente" })
                : BadRequest(new { mensaje = "No se pudo procesar la devolución" });
        }

        // PUT: api/Prestamos/{id}/renovar
        [HttpPut("{id}/renovar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult RenovarPrestamo(int id, [FromBody] RenovacionRequest? request = null)
        {
            var diasAdicionales = request?.DiasAdicionales ?? 15;
            var resultado = _prestamoBusiness.RenovarPrestamo(id, diasAdicionales);
            return resultado
                ? Ok(new { mensaje = "Préstamo renovado correctamente" })
                : BadRequest(new { mensaje = "No se pudo renovar el préstamo" });
        }

        // GET: api/Prestamos/mis-prestamos
        [HttpGet("mis-prestamos")]
        [Authorize]
        public IActionResult ObtenerMisPrestamos()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var lista = _prestamoBusiness.ListarPrestamosPorUsuario(id);
            return Ok(lista);
        }

        // GET: api/Prestamos/mi-historial
        [HttpGet("mi-historial")]
        [Authorize]
        public IActionResult ObtenerMiHistorial()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var historial = _prestamoBusiness.ObtenerHistorialCompletoUsuario(id);
            return Ok(historial);
        }

        // GET: api/Prestamos/mis-prestamos-activos
        [HttpGet("mis-prestamos-activos")]
        [Authorize]
        public IActionResult ObtenerMisPrestamosActivos()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var lista = _prestamoBusiness.ListarPrestamosActivosPorUsuario(id);
            return Ok(lista);
        }
    }
}
