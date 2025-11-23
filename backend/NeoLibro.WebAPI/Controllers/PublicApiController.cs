using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Controllers
{
    /// <summary>
    /// API Pública de solo lectura para el catálogo de libros
    /// Requiere API Key en el header X-API-Key
    /// </summary>
    [Route("api/public")]
    [ApiController]
    public class PublicApiController : ControllerBase
    {
        private readonly ILibroBusiness _libroBusiness;
        private readonly IRecomendacionBusiness _recomendacionBusiness;

        public PublicApiController(ILibroBusiness libroBusiness, IRecomendacionBusiness recomendacionBusiness)
        {
            _libroBusiness = libroBusiness;
            _recomendacionBusiness = recomendacionBusiness;
        }

        /// <summary>
        /// Obtiene todos los libros del catálogo (paginado)
        /// </summary>
        /// <param name="pagina">Número de página (por defecto 1)</param>
        /// <param name="tamanoPagina">Tamaño de página (por defecto 50, máximo 100)</param>
        /// <returns>Lista de libros</returns>
        [HttpGet("libros")]
        public IActionResult ListarLibros([FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 50)
        {
            if (pagina < 1) pagina = 1;
            if (tamanoPagina < 1) tamanoPagina = 50;
            if (tamanoPagina > 100) tamanoPagina = 100;

            var todosLosLibros = _libroBusiness.Listar();
            var total = todosLosLibros.Count;
            var totalPaginas = (int)Math.Ceiling(total / (double)tamanoPagina);

            var libros = todosLosLibros
                .Skip((pagina - 1) * tamanoPagina)
                .Take(tamanoPagina)
                .ToList();

            return Ok(new
            {
                datos = libros,
                paginacion = new
                {
                    paginaActual = pagina,
                    tamanoPagina = tamanoPagina,
                    totalRegistros = total,
                    totalPaginas = totalPaginas,
                    tieneAnterior = pagina > 1,
                    tieneSiguiente = pagina < totalPaginas
                }
            });
        }

        /// <summary>
        /// Obtiene un libro por su ID
        /// </summary>
        /// <param name="id">ID del libro</param>
        /// <returns>Información del libro</returns>
        [HttpGet("libros/{id}")]
        public IActionResult ObtenerLibroPorId(int id)
        {
            var libro = _libroBusiness.ObtenerPorId(id);
            if (libro == null)
                return NotFound(new { mensaje = "Libro no encontrado" });

            return Ok(libro);
        }

        /// <summary>
        /// Busca libros por título, autor o palabra clave
        /// </summary>
        /// <param name="titulo">Título del libro (opcional)</param>
        /// <param name="autor">Nombre del autor (opcional)</param>
        /// <param name="palabraClave">Palabra clave para buscar (opcional)</param>
        /// <param name="pagina">Número de página (por defecto 1)</param>
        /// <param name="tamanoPagina">Tamaño de página (por defecto 50, máximo 100)</param>
        /// <returns>Lista de libros que coinciden con la búsqueda</returns>
        [HttpGet("libros/buscar")]
        public IActionResult BuscarLibros(
            [FromQuery] string? titulo,
            [FromQuery] string? autor,
            [FromQuery] string? palabraClave,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanoPagina = 50)
        {
            if (pagina < 1) pagina = 1;
            if (tamanoPagina < 1) tamanoPagina = 50;
            if (tamanoPagina > 100) tamanoPagina = 100;

            var resultados = _libroBusiness.Buscar(autor, titulo, palabraClave);
            var total = resultados.Count;
            var totalPaginas = (int)Math.Ceiling(total / (double)tamanoPagina);

            var libros = resultados
                .Skip((pagina - 1) * tamanoPagina)
                .Take(tamanoPagina)
                .ToList();

            return Ok(new
            {
                datos = libros,
                paginacion = new
                {
                    paginaActual = pagina,
                    tamanoPagina = tamanoPagina,
                    totalRegistros = total,
                    totalPaginas = totalPaginas,
                    tieneAnterior = pagina > 1,
                    tieneSiguiente = pagina < totalPaginas
                },
                filtros = new
                {
                    titulo = titulo,
                    autor = autor,
                    palabraClave = palabraClave
                }
            });
        }

        /// <summary>
        /// Obtiene las recomendaciones públicas de profesores
        /// </summary>
        /// <param name="pagina">Número de página (por defecto 1)</param>
        /// <param name="tamanoPagina">Tamaño de página (por defecto 20, máximo 50)</param>
        /// <returns>Lista de recomendaciones</returns>
        [HttpGet("recomendaciones")]
        public IActionResult ListarRecomendaciones([FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
        {
            if (pagina < 1) pagina = 1;
            if (tamanoPagina < 1) tamanoPagina = 20;
            if (tamanoPagina > 50) tamanoPagina = 50;

            var todasLasRecomendaciones = _recomendacionBusiness.ListarPublicas();
            var total = todasLasRecomendaciones.Count;
            var totalPaginas = (int)Math.Ceiling(total / (double)tamanoPagina);

            var recomendaciones = todasLasRecomendaciones
                .Skip((pagina - 1) * tamanoPagina)
                .Take(tamanoPagina)
                .ToList();

            return Ok(new
            {
                datos = recomendaciones,
                paginacion = new
                {
                    paginaActual = pagina,
                    tamanoPagina = tamanoPagina,
                    totalRegistros = total,
                    totalPaginas = totalPaginas,
                    tieneAnterior = pagina > 1,
                    tieneSiguiente = pagina < totalPaginas
                }
            });
        }

        /// <summary>
        /// Obtiene información sobre la API
        /// </summary>
        [HttpGet("info")]
        public IActionResult Info()
        {
            return Ok(new
            {
                nombre = "Biblioteca FISI - API Pública",
                version = "1.0.0",
                descripcion = "API pública de solo lectura para consultar el catálogo de libros y recomendaciones",
                endpoints = new
                {
                    libros = "/api/public/libros",
                    libroPorId = "/api/public/libros/{id}",
                    buscarLibros = "/api/public/libros/buscar",
                    recomendaciones = "/api/public/recomendaciones",
                    info = "/api/public/info"
                },
                autenticacion = "Requiere API Key en el header X-API-Key",
                documentacion = "Ver documentación completa en /api/public/docs"
            });
        }
    }
}


