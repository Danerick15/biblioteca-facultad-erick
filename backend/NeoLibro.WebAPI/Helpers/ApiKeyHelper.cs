using System.Security.Cryptography;
using System.Text;

namespace NeoLibroAPI.Helpers
{
    /// <summary>
    /// Helper para generar y validar API Keys
    /// </summary>
    public static class ApiKeyHelper
    {
        /// <summary>
        /// Genera una nueva API Key segura
        /// </summary>
        public static string GenerarApiKey()
        {
            // Generar una clave de 64 caracteres usando caracteres alfanuméricos y guiones
            const string caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
            var random = new Random();
            var bytes = new byte[48];
            
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            
            var sb = new StringBuilder(64);
            sb.Append("blib_"); // Prefijo para identificar que es de la biblioteca
            
            for (int i = 0; i < 48; i++)
            {
                sb.Append(caracteres[bytes[i] % caracteres.Length]);
            }
            
            return sb.ToString();
        }

        /// <summary>
        /// Valida el formato de una API Key
        /// </summary>
        public static bool ValidarFormato(string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                return false;

            // Debe empezar con "blib_" y tener al menos 50 caracteres
            return apiKey.StartsWith("blib_") && apiKey.Length >= 50;
        }
    }
}


