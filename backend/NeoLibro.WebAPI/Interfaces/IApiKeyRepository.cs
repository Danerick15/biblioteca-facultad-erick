using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de API Keys
    /// </summary>
    public interface IApiKeyRepository
    {
        /// <summary>
        /// Obtiene una API Key por su valor
        /// </summary>
        ApiKey? ObtenerPorApiKey(string apiKey);

        /// <summary>
        /// Obtiene todas las API Keys
        /// </summary>
        List<ApiKey> Listar();

        /// <summary>
        /// Crea una nueva API Key
        /// </summary>
        bool Crear(ApiKey apiKey);

        /// <summary>
        /// Actualiza el uso de una API Key
        /// </summary>
        bool ActualizarUso(int apiKeyID, string? ipAddress, string? userAgent);

        /// <summary>
        /// Desactiva una API Key
        /// </summary>
        bool Desactivar(int apiKeyID);

        /// <summary>
        /// Verifica si una API Key está activa y puede usarse
        /// </summary>
        bool PuedeUsar(int apiKeyID);
    }
}


