using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.DTOs;
using System.Security.Claims;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservasController : ControllerBase
    {
        private readonly IReservaBusiness _reservaBusiness;

        public ReservasController(IReservaBusiness reservaBusiness)
        {
            _reservaBusiness = reservaBusiness;
        }

        public class CrearReservaRequest
        {
            public int LibroID { get; set; }
            public int? UsuarioID { get; set; }
            public int? EjemplarID { get; set; }
            public string TipoReserva { get; set; } = "ColaEspera";
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Crear([FromBody] CrearReservaRequest request)
        {
            if (request == null || request.LibroID <= 0)
                return BadRequest(new { mensaje = "LibroID es requerido" });

            var usuarioActualIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioActualIdStr) || !int.TryParse(usuarioActualIdStr, out int usuarioActualId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            var usuarioDestinoId = request.UsuarioID.HasValue && (rol == "Bibliotecaria" || rol == "Administrador")
                ? request.UsuarioID.Value
                : usuarioActualId;

            // Solo bibliotecarios pueden crear reservas de retiro inmediato
            if (request.TipoReserva == "Retiro" && rol != "Bibliotecaria" && rol != "Administrador")
            {
                return BadRequest(new { mensaje = "Solo los bibliotecarios pueden crear reservas de retiro inmediato" });
            }

            try
            {
                var reserva = await _reservaBusiness.CrearReserva(usuarioDestinoId, request.LibroID, request.TipoReserva, request.EjemplarID);
                return Ok(new {
                    mensaje = reserva.TipoReserva == "Retiro"
                        ? "Reserva creada para retiro inmediato"
                        : "Reserva agregada a la cola de espera",
                    reserva
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        [HttpGet("mis-reservas")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ReservaDTO>>> MisReservas()
        {
            try 
            {
                var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                    return Unauthorized(new { mensaje = "Usuario no válido" });

                Console.WriteLine($"[MisReservas] Obteniendo reservas para usuario ID: {usuarioId}");
                var lista = await _reservaBusiness.ListarReservasPorUsuario(usuarioId);
                Console.WriteLine($"[MisReservas] Encontradas {lista.Count()} reservas");
                
                // Log detallado de cada reserva encontrada
                foreach (var reserva in lista)
                {
                    Console.WriteLine($"[MisReservas] ReservaID: {reserva.ReservaID}, LibroID: {reserva.LibroID}, Estado: {reserva.Estado}, FechaReserva: {reserva.FechaReserva}");
                }
                
                return Ok(lista);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MisReservas] Error al obtener reservas: {ex.Message}");
                Console.WriteLine($"[MisReservas] StackTrace: {ex.StackTrace}");
                return StatusCode(500, new { mensaje = "Error al obtener las reservas", detalle = ex.Message });
            }
        }

        [HttpGet("para-retiro")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<ActionResult<IEnumerable<ReservaDTO>>> ReservasParaRetiro()
        {
            var lista = await _reservaBusiness.ListarReservasParaRetiro();
            return Ok(lista);
        }

        [HttpGet("en-espera")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<ActionResult<IEnumerable<AdminReservaDTO>>> ReservasEnEspera()
        {
            var lista = await _reservaBusiness.ListarReservasEnEspera();
            return Ok(lista);
        }

        [HttpDelete("{id}/cancelar")]
        [Authorize]
        public async Task<IActionResult> Cancelar(int id)
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            var esAdmin = rol == "Bibliotecaria" || rol == "Administrador";

            var ok = await _reservaBusiness.CancelarReserva(id, usuarioId, esAdmin);
            return ok
                ? Ok(new { mensaje = "Reserva cancelada" })
                : BadRequest(new { mensaje = "No se pudo cancelar la reserva" });
        }

        [HttpPost("{id}/convertir-a-retiro")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<IActionResult> ConvertirARetiro(int id)
        {
            var ok = await _reservaBusiness.ActualizarTipoReserva(id, "Retiro");
            return ok
                ? Ok(new { mensaje = "Reserva actualizada a retiro inmediato" })
                : BadRequest(new { mensaje = "No se pudo actualizar la reserva" });
        }

        [HttpPost("{id}/aprobar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<IActionResult> Aprobar(int id)
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int administradorId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var result = await _reservaBusiness.AprobarReserva(id, administradorId);
            // result >= 1 -> ID del préstamo creado
            // result == 0 -> aprobado pero sin préstamo (no se asignó ejemplar)
            // result < 0 -> error del procedimiento
            if (result > 0)
            {
                return Ok(new { mensaje = "Reserva aprobada y préstamo creado", prestamoID = result });
            }
            else if (result == 0)
            {
                return Ok(new { mensaje = "Reserva aprobada (sin préstamo asignado)" });
            }
            else
            {
                string mensajeError = result switch
                {
                    -1 => "Reserva no encontrada",
                    -2 => "La reserva ya está en un estado final y no puede ser aprobada",
                    -3 => "Error en el esquema de la base de datos",
                    -99 => "Error interno al procesar la aprobación. Verifique los logs del servidor.",
                    _ => $"No se pudo aprobar la reserva (código de error: {result})"
                };
                return BadRequest(new { mensaje = mensajeError, codigoError = result });
            }
        }

        [HttpPost("{id}/rechazar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<IActionResult> Rechazar(int id)
        {
            var usuarioIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int administradorId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            // Rechazar una reserva se interpreta como cancelarla por admin
            var ok = await _reservaBusiness.CancelarReserva(id, administradorId, true);
            return ok
                ? Ok(new { mensaje = "Reserva rechazada" })
                : BadRequest(new { mensaje = "No se pudo rechazar la reserva" });
        }

        [HttpPost("{id}/expirar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<IActionResult> Expirar(int id)
        {
            var ok = await _reservaBusiness.ExpirarReserva(id);
            return ok
                ? Ok(new { mensaje = "Reserva expirada" })
                : BadRequest(new { mensaje = "No se pudo expirar la reserva" });
        }

        [HttpPost("{id}/completar")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public async Task<IActionResult> Completar(int id)
        {
            var ok = await _reservaBusiness.MarcarComoCompletada(id);
            return ok
                ? Ok(new { mensaje = "Reserva completada" })
                : BadRequest(new { mensaje = "No se pudo completar la reserva" });
        }

        [HttpGet("posicion-cola/{libroId}/{reservaId}")]
        [Authorize]
        public async Task<IActionResult> ObtenerPosicionEnCola(int libroId, int reservaId)
        {
            var posicion = await _reservaBusiness.ObtenerPosicionEnCola(libroId, reservaId);
            return Ok(new { posicion });
        }
    }
}


