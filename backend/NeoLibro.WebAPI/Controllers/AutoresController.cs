using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AutoresController : ControllerBase
    {
        private readonly IAutorBusiness _autorBusiness;

        public AutoresController(IAutorBusiness autorBusiness)
        {
            _autorBusiness = autorBusiness;
        }

        // GET: api/Autores
        [HttpGet]
        public IActionResult Listar()
        {
            var lista = _autorBusiness.Listar();
            return Ok(lista);
        }

        // GET: api/Autores/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var autor = _autorBusiness.ObtenerPorId(id);
            if (autor == null)
                return NotFound(new { mensaje = "Autor no encontrado" });

            return Ok(autor);
        }

        // POST: api/Autores
        [HttpPost]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Crear([FromBody] Autor autor)
        {
            var resultado = _autorBusiness.Crear(autor);
            return resultado
                ? Ok(new { mensaje = "Autor creado correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear el autor. Verifique que el nombre no esté duplicado." });
        }

        // PUT: api/Autores/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Modificar(int id, [FromBody] Autor autor)
        {
            if (id != autor.AutorID)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _autorBusiness.Modificar(autor);
            return resultado
                ? Ok(new { mensaje = "Autor modificado correctamente" })
                : BadRequest(new { mensaje = "No se pudo modificar el autor. Verifique que el nombre no esté duplicado." });
        }

        // DELETE: api/Autores/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _autorBusiness.Eliminar(id);
            return resultado
                ? Ok(new { mensaje = "Autor eliminado correctamente" })
                : BadRequest(new { mensaje = "No se pudo eliminar el autor. Puede estar asociado a libros." });
        }
    }
}
