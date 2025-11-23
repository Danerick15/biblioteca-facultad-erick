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
    public class RecomendacionesController : ControllerBase
    {
        private readonly IRecomendacionBusiness _recomendacionBusiness;

        public RecomendacionesController(IRecomendacionBusiness recomendacionBusiness)
        {
            _recomendacionBusiness = recomendacionBusiness;
        }

        // GET: api/Recomendaciones/publicas
        // Endpoint público para que los estudiantes consulten las recomendaciones
        [HttpGet("publicas")]
        public IActionResult ListarPublicas()
        {
            var lista = _recomendacionBusiness.ListarPublicas();
            return Ok(lista);
        }

        // GET: api/Recomendaciones/profesor/{profesorId}
        // Endpoint para que un profesor vea sus propias recomendaciones
        [Authorize(Roles = "Profesor")]
        [HttpGet("profesor/{profesorId}")]
        public IActionResult ListarPorProfesor(int profesorId)
        {
            // Verificar que el profesor solo pueda ver sus propias recomendaciones
            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            if (usuarioId != profesorId)
                return Forbid();

            var lista = _recomendacionBusiness.ListarPorProfesor(profesorId);
            return Ok(lista);
        }

        // GET: api/Recomendaciones/mis-recomendaciones
        // Endpoint para que un profesor vea sus propias recomendaciones (usando el ID del usuario autenticado)
        [Authorize(Roles = "Profesor")]
        [HttpGet("mis-recomendaciones")]
        public IActionResult ListarMisRecomendaciones()
        {
            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var lista = _recomendacionBusiness.ListarPorProfesor(usuarioId);
            return Ok(lista);
        }

        // GET: api/Recomendaciones/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var recomendacion = _recomendacionBusiness.ObtenerPorId(id);
            if (recomendacion != null)
                return Ok(recomendacion);
            else
                return NotFound(new { mensaje = "Recomendación no encontrada" });
        }

        // POST: api/Recomendaciones
        [Authorize(Roles = "Profesor")]
        [HttpPost]
        public IActionResult Crear([FromBody] CrearRecomendacionRequest request)
        {
            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            var recomendacion = new Recomendacion
            {
                ProfesorID = usuarioId,
                Curso = request.Curso,
                LibroID = request.LibroID,
                URLExterna = request.URLExterna,
                Fecha = DateTime.Now
            };

            var resultado = _recomendacionBusiness.Crear(recomendacion);
            if (resultado)
                return Ok(new { mensaje = "Recomendación creada correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo crear la recomendación. Verifique que el curso esté especificado y que tenga al menos un libro o URL externa." });
        }

        // PUT: api/Recomendaciones/{id}
        [Authorize(Roles = "Profesor")]
        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] ModificarRecomendacionRequest request)
        {
            var recomendacionExistente = _recomendacionBusiness.ObtenerPorId(id);
            if (recomendacionExistente == null)
                return NotFound(new { mensaje = "Recomendación no encontrada" });

            // Verificar que el profesor solo pueda modificar sus propias recomendaciones
            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            if (recomendacionExistente.ProfesorID != usuarioId)
                return Forbid();

            var recomendacion = new Recomendacion
            {
                RecomendacionID = id,
                ProfesorID = recomendacionExistente.ProfesorID,
                Curso = request.Curso,
                LibroID = request.LibroID,
                URLExterna = request.URLExterna,
                Fecha = recomendacionExistente.Fecha
            };

            var resultado = _recomendacionBusiness.Modificar(recomendacion);
            if (resultado)
                return Ok(new { mensaje = "Recomendación modificada correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo modificar la recomendación. Verifique que el curso esté especificado y que tenga al menos un libro o URL externa." });
        }

        // DELETE: api/Recomendaciones/{id}
        [Authorize(Roles = "Profesor")]
        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var recomendacionExistente = _recomendacionBusiness.ObtenerPorId(id);
            if (recomendacionExistente == null)
                return NotFound(new { mensaje = "Recomendación no encontrada" });

            // Verificar que el profesor solo pueda eliminar sus propias recomendaciones
            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                return Unauthorized(new { mensaje = "Usuario no válido" });

            if (recomendacionExistente.ProfesorID != usuarioId)
                return Forbid();

            var resultado = _recomendacionBusiness.Eliminar(id);
            if (resultado)
                return Ok(new { mensaje = "Recomendación eliminada correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo eliminar la recomendación" });
        }
    }
}


