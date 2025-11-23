using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Helpers;

namespace NeoLibroAPI.Controllers
{
    /// <summary>
    /// Controller para gestionar API Keys (solo administradores)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class ApiKeysController : ControllerBase
    {
        private readonly IApiKeyRepository _apiKeyRepository;

        public ApiKeysController(IApiKeyRepository apiKeyRepository)
        {
            _apiKeyRepository = apiKeyRepository;
        }

        /// <summary>
        /// Obtiene todas las API Keys
        /// </summary>
        [HttpGet]
        public IActionResult Listar()
        {
            var apiKeys = _apiKeyRepository.Listar();
            // Ocultar la clave completa por seguridad, mostrar solo los primeros y últimos caracteres
            var apiKeysSeguras = apiKeys.Select(ak => new
            {
                ak.ApiKeyID,
                ApiKey = $"{ak.Key.Substring(0, 10)}...{ak.Key.Substring(ak.Key.Length - 5)}",
                ak.Nombre,
                ak.Descripcion,
                ak.Activa,
                ak.FechaCreacion,
                ak.FechaUltimoUso,
                ak.ContadorUso,
                ak.LimiteUsoDiario
            }).ToList();

            return Ok(apiKeysSeguras);
        }

        /// <summary>
        /// Crea una nueva API Key
        /// </summary>
        [HttpPost]
        public IActionResult Crear([FromBody] CrearApiKeyRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(new { mensaje = "El nombre es requerido" });

            var usuarioIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            int? usuarioId = null;
            if (!string.IsNullOrEmpty(usuarioIdStr) && int.TryParse(usuarioIdStr, out int id))
            {
                usuarioId = id;
            }

            var apiKey = new ApiKey
            {
                Key = ApiKeyHelper.GenerarApiKey(),
                Nombre = request.Nombre,
                Descripcion = request.Descripcion,
                Activa = true,
                FechaCreacion = DateTime.Now,
                LimiteUsoDiario = request.LimiteUsoDiario,
                CreadoPor = usuarioId
            };

            var resultado = _apiKeyRepository.Crear(apiKey);
            if (resultado)
            {
                // Solo mostrar la clave completa al crearla
                return Ok(new
                {
                    mensaje = "API Key creada exitosamente",
                    apiKey = apiKey.Key, // Mostrar completa solo al crear
                    apiKeyID = apiKey.ApiKeyID,
                    nombre = apiKey.Nombre,
                    advertencia = "⚠️ Guarda esta API Key de forma segura. No se mostrará nuevamente."
                });
            }
            else
            {
                return BadRequest(new { mensaje = "No se pudo crear la API Key" });
            }
        }

        /// <summary>
        /// Desactiva una API Key
        /// </summary>
        [HttpPut("{id}/desactivar")]
        public IActionResult Desactivar(int id)
        {
            var resultado = _apiKeyRepository.Desactivar(id);
            return resultado
                ? Ok(new { mensaje = "API Key desactivada correctamente" })
                : NotFound(new { mensaje = "API Key no encontrada" });
        }
    }

    public class CrearApiKeyRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int? LimiteUsoDiario { get; set; }
    }
}


