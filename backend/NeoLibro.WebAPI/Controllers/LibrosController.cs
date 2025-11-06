using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LibrosController : ControllerBase
    {
        private readonly ILibroBusiness _libroBusiness;

        public LibrosController(ILibroBusiness libroBusiness)
        {
            _libroBusiness = libroBusiness;
        }

        // GET: api/Libros
        [HttpGet]
        public IActionResult Listar()
        {
            var lista = _libroBusiness.Listar();
            return Ok(lista);
        }

        // GET: api/Libros/buscar?autor=nombreAutor&titulo=nombreTitulo
        [HttpGet("buscar")]
        public IActionResult Buscar([FromQuery] string? autor, [FromQuery] string? titulo)
        {
            var resultado = _libroBusiness.Buscar(autor, titulo);
            return Ok(resultado);
        }

        // GET: api/Libros/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var libro = _libroBusiness.ObtenerPorId(id);
            if (libro != null)
                return Ok(libro);
            else
                return NotFound(new { mensaje = "Libro no encontrado" });
        }

        // POST: api/Libros
        [Authorize(Roles = "Administrador")]
        [HttpPost]
        public IActionResult Crear([FromBody] Libro libro)
        {
            var resultado = _libroBusiness.Crear(libro);
            if (resultado)
                return Ok(new { mensaje = "Libro creado correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo crear el libro" });
        }

        // PUT: api/Libros/{id}
        [Authorize(Roles = "Administrador")]
        [HttpPut("{id}")]
        public IActionResult Modificar(int id, [FromBody] Libro libro)
        {
            if (id != libro.LibroID)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _libroBusiness.Modificar(libro);
            if (resultado)
                return Ok(new { mensaje = "Libro modificado correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo modificar el libro" });
        }

        // DELETE: api/Libros/{id}
        [Authorize(Roles = "Administrador")]
        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _libroBusiness.Eliminar(id);
            if (resultado)
                return Ok(new { mensaje = "Libro eliminado correctamente" });
            else
                return BadRequest(new { mensaje = "No se pudo eliminar el libro" });
        }
    }
}