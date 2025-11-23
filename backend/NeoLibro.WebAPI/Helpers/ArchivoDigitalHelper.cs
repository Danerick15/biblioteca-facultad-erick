using System.Security.Cryptography;
using System.Text;

namespace NeoLibroAPI.Helpers
{
    /// <summary>
    /// Helper para manejo de archivos digitales (HU-10)
    /// Gestiona almacenamiento, validación y seguridad de archivos
    /// </summary>
    public static class ArchivoDigitalHelper
    {
        // Tipos de archivo permitidos
        private static readonly string[] TiposPermitidos = { ".pdf", ".epub", ".txt", ".doc", ".docx" };
        
        // Tamaño máximo por defecto: 100 MB
        private const long TamañoMaximoDefault = 100 * 1024 * 1024; // 100 MB

        /// <summary>
        /// Obtiene la ruta base donde se almacenan los archivos digitales
        /// </summary>
        public static string ObtenerRutaBaseAlmacenamiento()
        {
            var rutaBase = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "libros-digitales");
            
            // Crear directorio si no existe
            if (!Directory.Exists(rutaBase))
            {
                Directory.CreateDirectory(rutaBase);
            }
            
            return rutaBase;
        }

        /// <summary>
        /// Genera un nombre de archivo único basado en el LibroID
        /// </summary>
        public static string GenerarNombreArchivo(int libroID, string nombreOriginal, string extension)
        {
            // Formato: libro_{ID}_{hash}.{extension}
            var hash = GenerarHash(nombreOriginal + DateTime.Now.Ticks);
            var nombreSeguro = $"libro_{libroID}_{hash.Substring(0, 8)}{extension}";
            return nombreSeguro;
        }

        /// <summary>
        /// Genera un hash corto para el nombre de archivo
        /// </summary>
        private static string GenerarHash(string input)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = Encoding.UTF8.GetBytes(input);
                var hash = sha256.ComputeHash(bytes);
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }

        /// <summary>
        /// Valida si el tipo de archivo está permitido
        /// </summary>
        public static bool EsTipoPermitido(string nombreArchivo)
        {
            var extension = Path.GetExtension(nombreArchivo).ToLower();
            return TiposPermitidos.Contains(extension);
        }

        /// <summary>
        /// Valida el tamaño del archivo
        /// </summary>
        public static bool EsTamañoValido(long tamañoBytes, long tamañoMaximo = TamañoMaximoDefault)
        {
            return tamañoBytes > 0 && tamañoBytes <= tamañoMaximo;
        }

        /// <summary>
        /// Obtiene el tipo MIME basado en la extensión
        /// </summary>
        public static string ObtenerTipoMIME(string nombreArchivo)
        {
            var extension = Path.GetExtension(nombreArchivo).ToLower();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".epub" => "application/epub+zip",
                ".txt" => "text/plain",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }

        /// <summary>
        /// Formatea el tamaño del archivo para mostrar al usuario
        /// </summary>
        public static string FormatearTamañoArchivo(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        /// <summary>
        /// Elimina un archivo digital si existe
        /// </summary>
        public static bool EliminarArchivo(string rutaArchivo)
        {
            try
            {
                if (File.Exists(rutaArchivo))
                {
                    File.Delete(rutaArchivo);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}

