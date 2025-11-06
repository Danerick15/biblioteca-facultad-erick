using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly ICategoriaBusiness _categoriaBusiness;

        public CategoriasController(ICategoriaBusiness categoriaBusiness)
        {
            _categoriaBusiness = categoriaBusiness;
        }

        // GET: api/Categorias
        [HttpGet]
        public IActionResult Listar()
        {
            var lista = _categoriaBusiness.Listar();
            return Ok(lista);
        }

        // GET: api/Categorias/{id}
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var categoria = _categoriaBusiness.ObtenerPorId(id);
            if (categoria == null)
                return NotFound(new { mensaje = "Categoría no encontrada" });

            return Ok(categoria);
        }

        // POST: api/Categorias
        [HttpPost]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Crear([FromBody] Categoria categoria)
        {
            var resultado = _categoriaBusiness.Crear(categoria);
            return resultado
                ? Ok(new { mensaje = "Categoría creada correctamente" })
                : BadRequest(new { mensaje = "No se pudo crear la categoría. Verifique que el nombre no esté duplicado." });
        }

        // PUT: api/Categorias/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Bibliotecaria,Administrador")]
        public IActionResult Modificar(int id, [FromBody] Categoria categoria)
        {
            if (id != categoria.CategoriaID)
                return BadRequest(new { mensaje = "El ID de la URL no coincide con el del cuerpo." });

            var resultado = _categoriaBusiness.Modificar(categoria);
            return resultado
                ? Ok(new { mensaje = "Categoría modificada correctamente" })
                : BadRequest(new { mensaje = "No se pudo modificar la categoría. Verifique que el nombre no esté duplicado." });
        }

        // DELETE: api/Categorias/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult Eliminar(int id)
        {
            var resultado = _categoriaBusiness.Eliminar(id);
            return resultado
                ? Ok(new { mensaje = "Categoría eliminada correctamente" })
                : BadRequest(new { mensaje = "No se pudo eliminar la categoría. Puede estar asociada a libros." });
        }
    }
}
