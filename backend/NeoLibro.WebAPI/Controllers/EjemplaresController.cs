using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EjemplaresController : ControllerBase
    {
        private readonly IEjemplarBusiness _ejemplarBusiness;

        public EjemplaresController(IEjemplarBusiness ejemplarBusiness)
        {
            _ejemplarBusiness = ejemplarBusiness;
        }

        // GET: api/Ejemplares
        [HttpGet]
        [Authorize] // Accesible para todos los usuarios autenticados
        public IActionResult Listar()
        {
            var lista = _ejemplarBusiness.Listar();
            return Ok(lista);
        }

        // GET: api/Ejemplares/libro/{libroId}
        [HttpGet("libro/{libroId}")]
        public IActionResult ListarPorLibro(int libroId)
        {
            var lista = _ejemplarBusiness.ListarPorLibro(libroId);
            return Ok(lista);
        }

        // GET: api/Ejemplares/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var ejemplar = _ejemplarBusiness.ObtenerPorId(id);
            return ejemplar != null
                ? Ok(ejemplar)
                : NotFound(new { mensaje = "Ejemplar no encontrado" });
        }

        // GET: api/Ejemplares/codigo/{codigoBarras}
        [HttpGet("codigo/{codigoBarras}")]
        public IActionResult ObtenerPorCodigoBarras(string codigoBarras)
        {
            var ejemplar = _ejemplarBusiness.ObtenerPorCodigoBarras(codigoBarras);
            return ejemplar != null
                ? Ok(ejemplar)
                : NotFound(new { mensaje = "Ejemplar no encontrado" });
        }

        // POST: api/Ejemplares
        [HttpPost]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Crear([FromBody] Ejemplar ejemplar)
        {
            var resultado = _ejemplarBusiness.Crear(ejemplar);
            return resultado
                ? Ok(new { mensaje = "Ejemplar creado correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear el ejemplar" });
        }

        // PUT: api/Ejemplares/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Modificar(int id, [FromBody] Ejemplar ejemplar)
        {
            if (id != ejemplar.EjemplarID)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _ejemplarBusiness.Modificar(ejemplar);
            return resultado
                ? Ok(new { mensaje = "Ejemplar modificado correctamente" })
                : BadRequest(new { mensaje = "No se pudo modificar el ejemplar" });
        }

        // DELETE: api/Ejemplares/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _ejemplarBusiness.Eliminar(id);
            return resultado
                ? Ok(new { mensaje = "Ejemplar eliminado correctamente" })
                : BadRequest(new { mensaje = "No se pudo eliminar el ejemplar" });
        }

        // PUT: api/Ejemplares/{id}/estado
        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult CambiarEstado(int id, [FromBody] string nuevoEstado)
        {
            var resultado = _ejemplarBusiness.CambiarEstado(id, nuevoEstado);
            return resultado
                ? Ok(new { mensaje = "Estado del ejemplar actualizado correctamente" })
                : BadRequest(new { mensaje = "No se pudo actualizar el estado del ejemplar" });
        }

        // GET: api/Ejemplares/libro/{libroId}/disponibles
        [HttpGet("libro/{libroId}/disponibles")]
        public IActionResult ObtenerEjemplaresDisponibles(int libroId)
        {
            var ejemplares = _ejemplarBusiness.ObtenerEjemplaresDisponibles(libroId);
            return Ok(ejemplares);
        }

        // GET: api/Ejemplares/libro/{libroId}/contadores
        [HttpGet("libro/{libroId}/contadores")]
        public IActionResult ObtenerContadores(int libroId)
        {
            var totales = _ejemplarBusiness.ContarEjemplaresTotales(libroId);
            var disponibles = _ejemplarBusiness.ContarEjemplaresDisponibles(libroId);
            
            return Ok(new
            {
                totales = totales,
                disponibles = disponibles,
                prestados = totales - disponibles
            });
        }
    }
}
