using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.DTOs;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NeoLibroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificacionesController : ControllerBase
    {
        private readonly INotificacionRepository _notificacionRepository;

        public NotificacionesController(INotificacionRepository notificacionRepository)
        {
            _notificacionRepository = notificacionRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotificaciones()
        {
            var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (usuarioId == 0) return Unauthorized();

            var notificaciones = await _notificacionRepository.GetNotificacionesByUsuario(usuarioId);
            return Ok(notificaciones);
        }

        [HttpGet("pendientes")]
        public async Task<IActionResult> GetNotificacionesPendientes()
        {
            var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (usuarioId == 0) return Unauthorized();

            var notificaciones = await _notificacionRepository.GetNotificacionesPendientesByUsuario(usuarioId);
            return Ok(notificaciones);
        }

        [HttpPost("{notificacionId}/marcar-leida")]
        public async Task<IActionResult> MarcarComoLeida(int notificacionId)
        {
            var resultado = await _notificacionRepository.MarcarComoLeida(notificacionId);
            if (!resultado)
                return NotFound();

            return Ok();
        }

        [HttpPost("marcar-todas-leidas")]
        public async Task<IActionResult> MarcarTodasComoLeidas()
        {
            var usuarioId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (usuarioId == 0) return Unauthorized();

            var resultado = await _notificacionRepository.MarcarTodasComoLeidas(usuarioId);
            if (!resultado)
                return BadRequest();

            return Ok();
        }

        [HttpDelete("{notificacionId}")]
        public async Task<IActionResult> EliminarNotificacion(int notificacionId)
        {
            var resultado = await _notificacionRepository.DeleteNotificacion(notificacionId);
            if (!resultado)
                return NotFound();

            return Ok();
        }
    }
}