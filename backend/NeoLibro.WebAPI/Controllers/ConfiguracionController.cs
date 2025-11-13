using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _configFilePath;

        public ConfiguracionController(IConfiguration configuration)
        {
            _configuration = configuration;
            _configFilePath = Path.Combine(Directory.GetCurrentDirectory(), "configuracion.json");
        }

        // GET: api/Configuracion
        [HttpGet]
        public IActionResult ObtenerConfiguracion()
        {
            try
            {
                var configuracion = CargarConfiguracion();
                return Ok(configuracion);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener configuración", error = ex.Message });
            }
        }

        // PUT: api/Configuracion
        [HttpPut]
        public IActionResult ActualizarConfiguracion([FromBody] object configuracion)
        {
            try
            {
                // Validar la configuración antes de guardar
                var errores = ValidarConfiguracionCompleta(configuracion);
                if (errores.Any())
                {
                    return BadRequest(new { mensaje = "Configuración inválida", errores = errores });
                }

                try
                {
                    GuardarConfiguracion(configuracion);
                }
                catch (UnauthorizedAccessException)
                {
                    return StatusCode(500, new { mensaje = "Error de permisos al guardar la configuración. Por favor, contacte al administrador del sistema." });
                }
                catch (IOException ex)
                {
                    return StatusCode(500, new { mensaje = "Error de E/S al guardar la configuración", error = ex.Message });
                }

                return Ok(new { mensaje = "Configuración actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al actualizar configuración", error = ex.Message });
            }
        }

        // GET: api/Configuracion/resetear
        [HttpPost("resetear")]
        public IActionResult ResetearConfiguracion()
        {
            try
            {
                var configuracionPorDefecto = ObtenerConfiguracionPorDefecto();
                GuardarConfiguracion(configuracionPorDefecto);
                return Ok(new { mensaje = "Configuración reseteada a valores por defecto" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al resetear configuración", error = ex.Message });
            }
        }

        // GET: api/Configuracion/validar
        [HttpPost("validar")]
        public IActionResult ValidarConfiguracion([FromBody] object configuracion)
        {
            try
            {
                var errores = ValidarConfiguracionCompleta(configuracion);
                
                if (errores.Any())
                {
                    return BadRequest(new { mensaje = "Configuración inválida", errores = errores });
                }

                return Ok(new { mensaje = "Configuración válida" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al validar configuración", error = ex.Message });
            }
        }

        private object CargarConfiguracion()
        {
            if (System.IO.File.Exists(_configFilePath))
            {
                var json = System.IO.File.ReadAllText(_configFilePath);
                return JsonSerializer.Deserialize<object>(json) ?? new object();
            }
            else
            {
                var configuracionPorDefecto = ObtenerConfiguracionPorDefecto();
                GuardarConfiguracion(configuracionPorDefecto);
                return configuracionPorDefecto;
            }
        }

        private void GuardarConfiguracion(object configuracion)
        {
            try
            {
                // Asegurarse de que el directorio existe
                var directorio = Path.GetDirectoryName(_configFilePath);
                if (directorio != null && !Directory.Exists(directorio))
                {
                    Directory.CreateDirectory(directorio);
                }

                // Serializar con manejo de errores
                var options = new JsonSerializerOptions
                {
                    WriteIndented = true,
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                };
                
                var json = JsonSerializer.Serialize(configuracion, options);

                // Escribir el archivo usando un flujo de archivo para mejor control
                using (var fileStream = new FileStream(_configFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                using (var writer = new StreamWriter(fileStream))
                {
                    writer.Write(json);
                    writer.Flush();
                }
                
                // También copiar el archivo a bin/Debug/net9.0 para asegurar que esté disponible
                // cuando se ejecuta desde Visual Studio o desde el ejecutable
                try
                {
                    var baseDir = AppContext.BaseDirectory;
                    var binConfigPath = Path.Combine(baseDir, "configuracion.json");
                    
                    // Solo copiar si el directorio de destino es diferente al de origen
                    if (!string.Equals(_configFilePath, binConfigPath, StringComparison.OrdinalIgnoreCase))
                    {
                        // Asegurar que el directorio de destino existe
                        var binDir = Path.GetDirectoryName(binConfigPath);
                        if (binDir != null && !Directory.Exists(binDir))
                        {
                            Directory.CreateDirectory(binDir);
                        }
                        
                        // Solo copiar si el directorio existe
                        if (binDir != null && Directory.Exists(binDir))
                        {
                            System.IO.File.Copy(_configFilePath, binConfigPath, overwrite: true);
                            Console.WriteLine($"[ConfiguracionController] Configuración copiada a: {binConfigPath}");
                        }
                    }
                }
                catch (Exception copyEx)
                {
                    // Si falla la copia, no es crítico, solo loguear (no lanzar excepción)
                    Console.WriteLine($"[ConfiguracionController] Advertencia: No se pudo copiar configuración a bin/Debug: {copyEx.Message}");
                    // No lanzar la excepción para que el guardado principal no falle
                }
            }
            catch (Exception ex)
            {
                throw new IOException($"Error al guardar la configuración: {ex.Message}", ex);
            }
        }

        private object ObtenerConfiguracionPorDefecto()
        {
            return new
            {
                // Configuración general
                general = new
                {
                    nombreBiblioteca = "Biblioteca FISI - Universidad Nacional de Ingeniería",
                    direccion = "Av. Túpac Amaru 210, Rímac, Lima",
                    telefono = "+51 1 481 1070",
                    email = "biblioteca@fisi.edu.pe",
                    sitioWeb = "https://www.fisi.edu.pe/biblioteca",
                    moneda = "PEN",
                    idioma = "es",
                    zonaHoraria = "America/Lima"
                },

                // Configuración de préstamos
                prestamos = new
                {
                    diasPrestamoEstudiante = 7,
                    diasPrestamoProfesor = 14,
                    maxPrestamosEstudiante = 3,
                    maxPrestamosProfesor = 5,
                    maxRenovaciones = 2,
                    diasGracia = 1
                },

                // Configuración de multas
                multas = new
                {
                    montoMultaPorDia = 2.00m,
                    multaMaxima = 50.00m,
                    descuentoMulta = 50,
                    diasDescuento = 3
                },

                // Configuración de notificaciones
                notificaciones = new
                {
                    notificacionesEmail = true,
                    notificacionesSMS = false,
                    recordatorioVencimiento = 1,
                    recordatorioMulta = 1
                },

                // Configuración de seguridad
                seguridad = new
                {
                    sesionTimeout = 30,
                    intentosLogin = 3,
                    passwordMinLength = 8,
                    requiereMayuscula = true,
                    requiereNumero = true,
                    requiereSimbolo = true
                },

                // Configuración de respaldo
                respaldo = new
                {
                    backupAutomatico = true,
                    frecuenciaBackup = "diario",
                    diasRetencion = 30
                },

                // Configuración de interfaz
                interfaz = new
                {
                    tema = "oscuro",
                    elementosPorPagina = 20,
                    mostrarImagenes = true,
                    animaciones = true
                },

                // Configuración de reportes
                reportes = new
                {
                    periodoPorDefecto = 6, // Meses para el período por defecto
                    topNLibros = 10, // Cantidad de libros en el ranking
                    topNUsuarios = 10, // Cantidad de usuarios en el ranking
                    añoPorDefecto = DateTime.Now.Year // Año por defecto para reportes mensuales
                }
            };
        }

        private List<string> ValidarConfiguracionCompleta(object configuracion)
        {
            var errores = new List<string>();

            try
            {
                var config = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(configuracion));

                // Validar configuración general
                if (config.TryGetProperty("general", out var general))
                {
                    if (!general.TryGetProperty("nombreBiblioteca", out var nombre) || string.IsNullOrEmpty(nombre.GetString()))
                        errores.Add("El nombre de la biblioteca es obligatorio");

                    if (!general.TryGetProperty("email", out var email) || string.IsNullOrEmpty(email.GetString()))
                        errores.Add("El email es obligatorio");

                    if (general.TryGetProperty("email", out var emailVal) && !IsValidEmail(emailVal.GetString() ?? ""))
                        errores.Add("El formato del email no es válido");
                }

                // Validar configuración de préstamos
                if (config.TryGetProperty("prestamos", out var prestamos))
                {
                    if (prestamos.TryGetProperty("diasPrestamoEstudiante", out var diasEst) && diasEst.GetInt32() <= 0)
                        errores.Add("Los días de préstamo para estudiantes deben ser mayor a 0");

                    if (prestamos.TryGetProperty("diasPrestamoProfesor", out var diasProf) && diasProf.GetInt32() <= 0)
                        errores.Add("Los días de préstamo para profesores deben ser mayor a 0");

                    if (prestamos.TryGetProperty("maxPrestamosEstudiante", out var maxEst) && maxEst.GetInt32() <= 0)
                        errores.Add("El máximo de préstamos para estudiantes debe ser mayor a 0");

                    if (prestamos.TryGetProperty("maxPrestamosProfesor", out var maxProf) && maxProf.GetInt32() <= 0)
                        errores.Add("El máximo de préstamos para profesores debe ser mayor a 0");
                }

                // Validar configuración de multas
                if (config.TryGetProperty("multas", out var multas))
                {
                    if (multas.TryGetProperty("montoMultaPorDia", out var monto) && monto.GetDecimal() < 0)
                        errores.Add("El monto de multa por día no puede ser negativo");

                    if (multas.TryGetProperty("multaMaxima", out var max) && max.GetDecimal() < 0)
                        errores.Add("La multa máxima no puede ser negativa");

                    if (multas.TryGetProperty("descuentoMulta", out var desc) && (desc.GetInt32() < 0 || desc.GetInt32() > 100))
                        errores.Add("El descuento de multa debe estar entre 0 y 100%");
                }

                // Validar configuración de seguridad
                if (config.TryGetProperty("seguridad", out var seguridad))
                {
                    if (seguridad.TryGetProperty("sesionTimeout", out var timeout) && timeout.GetInt32() < 5)
                        errores.Add("El timeout de sesión debe ser al menos 5 minutos");

                    if (seguridad.TryGetProperty("intentosLogin", out var intentos) && intentos.GetInt32() < 3)
                        errores.Add("Los intentos de login deben ser al menos 3");

                    if (seguridad.TryGetProperty("passwordMinLength", out var passLen) && passLen.GetInt32() < 6)
                        errores.Add("La longitud mínima de contraseña debe ser al menos 6 caracteres");
                }

                // Validar configuración de reportes
                if (config.TryGetProperty("reportes", out var reportes))
                {
                    if (reportes.TryGetProperty("periodoPorDefecto", out var periodo) && (periodo.GetInt32() < 1 || periodo.GetInt32() > 24))
                        errores.Add("El período por defecto debe estar entre 1 y 24 meses");

                    if (reportes.TryGetProperty("topNLibros", out var topLibros) && (topLibros.GetInt32() < 5 || topLibros.GetInt32() > 50))
                        errores.Add("El top N de libros debe estar entre 5 y 50");

                    if (reportes.TryGetProperty("topNUsuarios", out var topUsuarios) && (topUsuarios.GetInt32() < 5 || topUsuarios.GetInt32() > 50))
                        errores.Add("El top N de usuarios debe estar entre 5 y 50");

                    if (reportes.TryGetProperty("añoPorDefecto", out var año) && (año.GetInt32() < 2020 || año.GetInt32() > DateTime.Now.Year + 1))
                        errores.Add($"El año por defecto debe estar entre 2020 y {DateTime.Now.Year + 1}");
                }
            }
            catch (Exception ex)
            {
                errores.Add($"Error al validar configuración: {ex.Message}");
            }

            return errores;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
