using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Models.Requests;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MultasController : ControllerBase
    {
        private readonly IMultaBusiness _multaBusiness;

        public MultasController(IMultaBusiness multaBusiness)
        {
            _multaBusiness = multaBusiness;
        }

        // GET: api/Multas/mis-multas
        [HttpGet("mis-multas")]
        [Authorize]
        public IActionResult ObtenerMisMultas()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var lista = _multaBusiness.ListarMultasPorUsuario(id);
            return Ok(lista);
        }

        // GET: api/Multas/mis-multas-pendientes
        [HttpGet("mis-multas-pendientes")]
        [Authorize]
        public IActionResult ObtenerMisMultasPendientes()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var lista = _multaBusiness.ListarMultasPendientesPorUsuario(id);
            return Ok(lista);
        }

        // GET: api/Multas/mi-resumen-multas
        [HttpGet("mi-resumen-multas")]
        [Authorize]
        public IActionResult ObtenerMiResumenMultas()
        {
            var usuarioId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioId) || !int.TryParse(usuarioId, out int id))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var resumen = _multaBusiness.ObtenerResumenMultasUsuario(id);
            return Ok(resumen);
        }

        // GET: api/Multas/usuario/{usuarioId}
        [HttpGet("usuario/{usuarioId}")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult ListarMultasPorUsuario(int usuarioId)
        {
            var lista = _multaBusiness.ListarMultasPorUsuario(usuarioId);
            return Ok(lista);
        }

        // GET: api/Multas/pendientes
        [HttpGet("pendientes")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult ListarMultasPendientes()
        {
            var lista = _multaBusiness.ListarMultasPendientes();
            return Ok(lista);
        }

        // PUT: api/Multas/{id}/pagar
        [HttpPut("{id}/pagar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult PagarMulta(int id, [FromBody] PagarMultaRequest? request = null)
        {
            var observaciones = request?.Observaciones;
            var resultado = _multaBusiness.PagarMulta(id, observaciones);
            return resultado
                ? Ok(new { mensaje = "Multa pagada correctamente" })
                : BadRequest(new { mensaje = "No se pudo procesar el pago de la multa" });
        }

        // POST: api/Multas
        [HttpPost]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult CrearMulta([FromBody] CrearMultaRequest request)
        {
            if (request.PrestamoID <= 0 || request.UsuarioID <= 0 || request.Monto <= 0)
                return BadRequest(new { mensaje = "PrestamoID, UsuarioID y Monto son requeridos" });

            var resultado = _multaBusiness.CrearMulta(request.PrestamoID, request.UsuarioID, request.Monto, request.Motivo, request.DiasAtraso);
            return resultado
                ? Ok(new { mensaje = "Multa creada correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear la multa" });
        }

        // POST: api/Multas/generar-automaticas
        [HttpPost("generar-automaticas")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult GenerarMultasAutomaticas()
        {
            try
            {
                var multasGeneradas = _multaBusiness.GenerarMultasAutomaticas();
                return Ok(new { 
                    mensaje = $"Se generaron {multasGeneradas} multa(s) automáticamente",
                    multasGeneradas = multasGeneradas
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al generar multas automáticas", error = ex.Message });
            }
        }

        // POST: api/Multas/corregir-prestamos-devueltos
        [HttpPost("corregir-prestamos-devueltos")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult CorregirMultasPrestamosDevueltos()
        {
            try
            {
                var multasActualizadas = _multaBusiness.CorregirMultasPrestamosDevueltos();
                return Ok(new { 
                    mensaje = $"Se corrigieron {multasActualizadas} multa(s) de préstamos ya devueltos",
                    multasActualizadas = multasActualizadas
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al corregir multas de préstamos devueltos", error = ex.Message });
            }
        }
    }
}
