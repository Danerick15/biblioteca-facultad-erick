using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Helpers;

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

        // GET: api/Libros/buscar?autor=nombreAutor&titulo=nombreTitulo&palabraClave=keyword
        [HttpGet("buscar")]
        public IActionResult Buscar([FromQuery] string? autor, [FromQuery] string? titulo, [FromQuery] string? palabraClave)
        {
            var resultado = _libroBusiness.Buscar(autor, titulo, palabraClave);
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

        // ========== ENDPOINTS PARA ARCHIVOS DIGITALES (HU-10) ==========

        // POST: api/Libros/{id}/archivo-digital
        [Authorize(Roles = "Administrador,Bibliotecaria")]
        [HttpPost("{id}/archivo-digital")]
        public async Task<IActionResult> SubirArchivoDigital(int id, IFormFile archivo)
        {
            try
            {
                if (archivo == null || archivo.Length == 0)
                    return BadRequest(new { mensaje = "No se proporcionó ningún archivo" });

                // Validar tipo de archivo
                if (!ArchivoDigitalHelper.EsTipoPermitido(archivo.FileName))
                    return BadRequest(new { mensaje = "Tipo de archivo no permitido. Se permiten: PDF, EPUB, TXT, DOC, DOCX" });

                // Validar tamaño (100 MB máximo)
                if (!ArchivoDigitalHelper.EsTamañoValido(archivo.Length))
                    return BadRequest(new { mensaje = "El archivo es demasiado grande. Tamaño máximo: 100 MB" });

                // Verificar que el libro existe
                var libro = _libroBusiness.ObtenerPorId(id);
                if (libro == null)
                    return NotFound(new { mensaje = "Libro no encontrado" });

                // Generar nombre de archivo único
                var extension = Path.GetExtension(archivo.FileName);
                var nombreArchivo = ArchivoDigitalHelper.GenerarNombreArchivo(id, archivo.FileName, extension);
                var rutaBase = ArchivoDigitalHelper.ObtenerRutaBaseAlmacenamiento();
                var rutaCompleta = Path.Combine(rutaBase, nombreArchivo);

                // Guardar archivo
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await archivo.CopyToAsync(stream);
                }

                // Si ya existe un archivo anterior, eliminarlo
                var rutaAnterior = _libroBusiness.ObtenerRutaArchivoDigital(id);
                if (!string.IsNullOrEmpty(rutaAnterior) && System.IO.File.Exists(rutaAnterior))
                {
                    ArchivoDigitalHelper.EliminarArchivo(rutaAnterior);
                }

                // Actualizar base de datos
                var tipoArchivo = extension.Substring(1).ToUpper(); // Sin el punto
                var resultado = _libroBusiness.ActualizarArchivoDigital(id, rutaCompleta, tipoArchivo, archivo.Length);

                if (resultado)
                    return Ok(new { 
                        mensaje = "Archivo subido correctamente",
                        rutaArchivo = rutaCompleta,
                        tamaño = ArchivoDigitalHelper.FormatearTamañoArchivo(archivo.Length)
                    });
                else
                    return BadRequest(new { mensaje = "Error al actualizar la información del archivo en la base de datos" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al subir el archivo", error = ex.Message });
            }
        }

        // DELETE: api/Libros/{id}/archivo-digital
        [Authorize(Roles = "Administrador,Bibliotecaria")]
        [HttpDelete("{id}/archivo-digital")]
        public IActionResult EliminarArchivoDigital(int id)
        {
            try
            {
                // Obtener ruta del archivo antes de eliminar
                var rutaArchivo = _libroBusiness.ObtenerRutaArchivoDigital(id);
                
                // Eliminar de la base de datos
                var resultado = _libroBusiness.EliminarArchivoDigital(id);
                
                if (resultado)
                {
                    // Eliminar archivo físico si existe
                    if (!string.IsNullOrEmpty(rutaArchivo) && System.IO.File.Exists(rutaArchivo))
                    {
                        ArchivoDigitalHelper.EliminarArchivo(rutaArchivo);
                    }
                    return Ok(new { mensaje = "Archivo digital eliminado correctamente" });
                }
                else
                    return BadRequest(new { mensaje = "No se pudo eliminar el archivo digital" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al eliminar el archivo", error = ex.Message });
            }
        }

        // GET: api/Libros/{id}/archivo-digital/ver
        [Authorize]
        [HttpGet("{id}/archivo-digital/ver")]
        public IActionResult VerArchivoDigital(int id)
        {
            try
            {
                var rutaArchivo = _libroBusiness.ObtenerRutaArchivoDigital(id);
                
                if (string.IsNullOrEmpty(rutaArchivo) || !System.IO.File.Exists(rutaArchivo))
                    return NotFound(new { mensaje = "Archivo digital no encontrado" });

                // Obtener usuario actual
                var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                    return Unauthorized(new { mensaje = "Usuario no válido" });

                // Registrar acceso
                var ipAcceso = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();
                _libroBusiness.RegistrarAccesoDigital(id, usuarioId, "Vista", ipAcceso, userAgent);

                // Leer y retornar archivo
                var archivoBytes = System.IO.File.ReadAllBytes(rutaArchivo);
                var tipoMIME = ArchivoDigitalHelper.ObtenerTipoMIME(rutaArchivo);
                var nombreArchivo = Path.GetFileName(rutaArchivo);

                return File(archivoBytes, tipoMIME, nombreArchivo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al acceder al archivo", error = ex.Message });
            }
        }

        // GET: api/Libros/{id}/archivo-digital/descargar
        [Authorize]
        [HttpGet("{id}/archivo-digital/descargar")]
        public IActionResult DescargarArchivoDigital(int id)
        {
            try
            {
                var libro = _libroBusiness.ObtenerPorId(id);
                if (libro == null)
                    return NotFound(new { mensaje = "Libro no encontrado" });

                var rutaArchivo = _libroBusiness.ObtenerRutaArchivoDigital(id);
                
                if (string.IsNullOrEmpty(rutaArchivo) || !System.IO.File.Exists(rutaArchivo))
                    return NotFound(new { mensaje = "Archivo digital no encontrado" });

                // Obtener usuario actual
                var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(usuarioIdStr) || !int.TryParse(usuarioIdStr, out int usuarioId))
                    return Unauthorized(new { mensaje = "Usuario no válido" });

                // Registrar descarga
                var ipAcceso = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();
                _libroBusiness.RegistrarAccesoDigital(id, usuarioId, "Descarga", ipAcceso, userAgent);

                // Leer y retornar archivo para descarga
                var archivoBytes = System.IO.File.ReadAllBytes(rutaArchivo);
                var tipoMIME = ArchivoDigitalHelper.ObtenerTipoMIME(rutaArchivo);
                var nombreDescarga = $"{libro.Titulo.Replace(" ", "_")}{Path.GetExtension(rutaArchivo)}";

                return File(archivoBytes, tipoMIME, nombreDescarga);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al descargar el archivo", error = ex.Message });
            }
        }

        // ========== ENDPOINT PARA CARGA MASIVA (HU-07) ==========

        // POST: api/Libros/carga-masiva
        [Authorize(Roles = "Administrador,Bibliotecaria")]
        [HttpPost("carga-masiva")]
        public IActionResult CargaMasiva(IFormFile archivo)
        {
            try
            {
                if (archivo == null || archivo.Length == 0)
                    return BadRequest(new { mensaje = "No se proporcionó ningún archivo" });

                // Validar tipo de archivo
                var extension = Path.GetExtension(archivo.FileName).ToLower();
                if (extension != ".csv" && extension != ".xlsx" && extension != ".xls")
                    return BadRequest(new { mensaje = "Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)" });

                // Validar tamaño (máximo 10 MB)
                const long tamañoMaximo = 10 * 1024 * 1024; // 10 MB
                if (archivo.Length > tamañoMaximo)
                    return BadRequest(new { mensaje = "El archivo es demasiado grande. Tamaño máximo: 10 MB" });

                // Procesar carga masiva
                using var stream = archivo.OpenReadStream();
                var resultado = _libroBusiness.ProcesarCargaMasiva(stream, archivo.FileName);

                return Ok(new
                {
                    mensaje = $"Procesamiento completado: {resultado.Exitosas} exitosas, {resultado.Fallidas} fallidas de {resultado.TotalFilas} total",
                    totalFilas = resultado.TotalFilas,
                    exitosas = resultado.Exitosas,
                    fallidas = resultado.Fallidas,
                    resultados = resultado.Resultados.Select(r => new
                    {
                        numeroFila = r.NumeroFila,
                        exitoso = r.Exitoso,
                        mensaje = r.Mensaje,
                        titulo = r.Datos?.Titulo ?? "",
                        isbn = r.Datos?.ISBN ?? ""
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al procesar la carga masiva", error = ex.Message });
            }
        }
    }
}