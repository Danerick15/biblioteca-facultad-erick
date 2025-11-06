using System.Text.Json;

namespace NeoLibroAPI.Helpers
{
    /// <summary>
    /// Helper para leer la configuración del sistema desde configuracion.json
    /// </summary>
    public static class ConfiguracionHelper
    {
        /// <summary>
        /// Obtiene la ruta del archivo de configuración, usando la misma lógica que ConfiguracionController
        /// </summary>
        private static string ObtenerRutaConfiguracion()
        {
            // Buscar el archivo en el directorio del proyecto (donde está el .csproj)
            // Esto asegura que siempre usemos el mismo archivo que el ConfiguracionController
            
            // Primero intentar en el directorio actual
            var currentDir = Directory.GetCurrentDirectory();
            var configPath = Path.Combine(currentDir, "configuracion.json");
            
            if (File.Exists(configPath))
            {
                return configPath;
            }
            
            // Si no existe, buscar en AppContext.BaseDirectory (bin/Debug/net9.0)
            var baseDir = AppContext.BaseDirectory;
            configPath = Path.Combine(baseDir, "configuracion.json");
            
            if (File.Exists(configPath))
            {
                return configPath;
            }
            
            // Si tampoco existe, buscar subiendo desde bin/Debug/net9.0 hasta el directorio del proyecto
            var baseDirInfo = new DirectoryInfo(baseDir);
            var projectDir = baseDirInfo.Parent?.Parent?.Parent?.FullName;
            
            if (projectDir != null)
            {
                configPath = Path.Combine(projectDir, "configuracion.json");
                if (File.Exists(configPath))
                {
                    return configPath;
                }
            }
            
            // Si no se encuentra en ningún lado, usar el directorio actual como fallback
            // Esto es lo que hace ConfiguracionController
            return Path.Combine(Directory.GetCurrentDirectory(), "configuracion.json");
        }

        /// <summary>
        /// Obtiene los días de préstamo según el rol del usuario desde la configuración
        /// </summary>
        /// <param name="rolUsuario">Rol del usuario (Profesor, Estudiante, etc.)</param>
        /// <param name="valorPorDefecto">Valor por defecto si no se puede leer la configuración (default: 15)</param>
        /// <returns>Días de préstamo según el rol</returns>
        public static int ObtenerDiasPrestamoPorRol(string? rolUsuario, int valorPorDefecto = 15)
        {
            try
            {
                var configPath = ObtenerRutaConfiguracion();
                
                // Solo loguear en modo debug para no saturar los logs
                #if DEBUG
                Console.WriteLine($"[ConfiguracionHelper] Usando archivo de configuración: {configPath}");
                Console.WriteLine($"[ConfiguracionHelper] Archivo existe: {File.Exists(configPath)}");
                #endif
                
                if (!File.Exists(configPath))
                {
                    Console.WriteLine($"[ConfiguracionHelper] WARNING: Archivo de configuración no encontrado en: {configPath}");
                    Console.WriteLine($"[ConfiguracionHelper] Usando valor por defecto: {valorPorDefecto} días");
                    return valorPorDefecto;
                }

                var json = File.ReadAllText(configPath);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("prestamos", out var prestamosConfig))
                {
                    Console.WriteLine("[ConfiguracionHelper] WARNING: Sección 'prestamos' no encontrada en la configuración");
                    return valorPorDefecto;
                }

                // Normalizar el rol para comparación (case-insensitive)
                var rolNormalizado = rolUsuario?.Trim() ?? "";
                
                #if DEBUG
                Console.WriteLine($"[ConfiguracionHelper] Rol del usuario: '{rolUsuario}' (normalizado: '{rolNormalizado}')");
                #endif

                // Determinar días según el rol del usuario (comparación case-insensitive)
                if (string.Equals(rolNormalizado, "Profesor", StringComparison.OrdinalIgnoreCase))
                {
                    if (prestamosConfig.TryGetProperty("diasPrestamoProfesor", out var diasProfesor))
                    {
                        var dias = diasProfesor.GetInt32();
                        #if DEBUG
                        Console.WriteLine($"[ConfiguracionHelper] Usando días para Profesor: {dias}");
                        #endif
                        return dias;
                    }
                }

                // Para Estudiante y otros roles, usar días de estudiante
                if (prestamosConfig.TryGetProperty("diasPrestamoEstudiante", out var diasEstudiante))
                {
                    var dias = diasEstudiante.GetInt32();
                    #if DEBUG
                    Console.WriteLine($"[ConfiguracionHelper] Usando días para Estudiante/Otros: {dias} (rol: '{rolNormalizado}')");
                    #endif
                    return dias;
                }

                Console.WriteLine("[ConfiguracionHelper] WARNING: No se encontró 'diasPrestamoEstudiante' en la configuración, usando valor por defecto");
                return valorPorDefecto;
            }
            catch (Exception ex)
            {
                // Si falla leer la configuración, usar valor por defecto (no debe bloquear el sistema)
                Console.WriteLine($"[ConfiguracionHelper] ERROR al leer configuración: {ex.Message}");
                #if DEBUG
                Console.WriteLine($"[ConfiguracionHelper] StackTrace: {ex.StackTrace}");
                #endif
                Console.WriteLine($"[ConfiguracionHelper] Usando valor por defecto: {valorPorDefecto} días");
                return valorPorDefecto;
            }
        }
    }
}