using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Multas
    /// Maneja todas las operaciones de lógica de negocio para multas
    /// </summary>
    public class MultaBusiness : IMultaBusiness
    {
        private readonly IMultaRepository _multaRepository;
        private readonly IPrestamoBusiness _prestamoBusiness;

        public MultaBusiness(IMultaRepository multaRepository, IPrestamoBusiness prestamoBusiness)
        {
            _multaRepository = multaRepository;
            _prestamoBusiness = prestamoBusiness;
        }

        public List<Multa> ListarMultasPorUsuario(int usuarioId)
        {
            // Corregir automáticamente multas de préstamos ya devueltos
            CorregirMultasPrestamosDevueltos();
            return _multaRepository.ListarMultasPorUsuario(usuarioId);
        }

        public List<Multa> ListarMultasPendientes()
        {
            // Corregir automáticamente multas de préstamos ya devueltos
            CorregirMultasPrestamosDevueltos();
            return _multaRepository.ListarMultasPendientes();
        }

        public List<Multa> ListarMultasPendientesPorUsuario(int usuarioId)
        {
            // Corregir automáticamente multas de préstamos ya devueltos
            CorregirMultasPrestamosDevueltos();
            return _multaRepository.ListarMultasPendientesPorUsuario(usuarioId);
        }

        public ResumenMultasDTO ObtenerResumenMultasUsuario(int usuarioId)
        {
            // Corregir automáticamente multas de préstamos ya devueltos
            CorregirMultasPrestamosDevueltos();
            return _multaRepository.ObtenerResumenMultasUsuario(usuarioId);
        }

        public bool CrearMulta(int prestamoId, int usuarioId, decimal monto, string? motivo = null, int? diasAtraso = null)
        {
            // Validaciones de negocio
            if (prestamoId <= 0 || usuarioId <= 0)
                return false;

            if (monto <= 0)
                return false;

            // Crear la multa
            var multa = new Multa
            {
                PrestamoID = prestamoId,
                UsuarioID = usuarioId,
                Monto = monto,
                Estado = "Pendiente",
                Motivo = motivo,
                DiasAtraso = diasAtraso
            };

            return _multaRepository.Crear(multa);
        }

        public bool PagarMulta(int multaId, string? observaciones = null)
        {
            // Validaciones de negocio
            if (multaId <= 0)
                return false;

            // Verificar que la multa existe y está pendiente
            var multa = _multaRepository.ObtenerPorId(multaId);
            if (multa == null || multa.Estado != "Pendiente")
                return false;

            return _multaRepository.PagarMulta(multaId, observaciones);
        }

        public Multa? ObtenerPorId(int multaId)
        {
            return _multaRepository.ObtenerPorId(multaId);
        }

        public bool TieneMultasPendientes(int usuarioId)
        {
            return _multaRepository.TieneMultasPendientes(usuarioId);
        }

        public int GenerarMultasAutomaticas()
        {
            try
            {
                // Obtener todos los préstamos activos
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var hoy = DateTime.Now.Date;
                int multasGeneradas = 0;

                // Obtener monto de multa por día desde la configuración
                decimal montoPorDia = ObtenerMontoMultaPorDia();

                foreach (var prestamo in prestamos)
                {
                    // Verificar si el préstamo está vencido
                    var fechaVencimiento = prestamo.FechaVencimiento.Date;
                    if (fechaVencimiento >= hoy)
                        continue; // No está vencido

                    // Verificar si ya existe una multa pendiente para este préstamo
                    var multasExistentes = _multaRepository.ListarMultasPorUsuario(prestamo.UsuarioID)
                        .Where(m => m.PrestamoID == prestamo.PrestamoID && m.Estado == "Pendiente")
                        .ToList();

                    if (multasExistentes.Any())
                        continue; // Ya tiene multa pendiente

                    // Calcular días de atraso
                    int diasAtraso = (hoy - fechaVencimiento).Days;

                    // Calcular monto de la multa (monto por día * días de atraso)
                    decimal montoMulta = montoPorDia * diasAtraso;

                    // Crear la multa
                    bool creada = CrearMulta(
                        prestamo.PrestamoID,
                        prestamo.UsuarioID,
                        montoMulta,
                        $"Retraso en devolución - {diasAtraso} día(s) de atraso",
                        diasAtraso
                    );

                    if (creada)
                        multasGeneradas++;
                }

                return multasGeneradas;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al generar multas automáticas: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return 0;
            }
        }

        private decimal ObtenerMontoMultaPorDia()
        {
            try
            {
                var configPath = Path.Combine(Directory.GetCurrentDirectory(), "configuracion.json");
                if (!File.Exists(configPath))
                {
                    // Buscar en bin/Debug/net9.0
                    var baseDir = AppContext.BaseDirectory;
                    configPath = Path.Combine(baseDir, "configuracion.json");
                }

                if (File.Exists(configPath))
                {
                    var json = File.ReadAllText(configPath);
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("multas", out var multasConfig))
                    {
                        if (multasConfig.TryGetProperty("montoMultaPorDia", out var monto))
                        {
                            return monto.GetDecimal();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al leer monto de multa por día: {ex.Message}");
            }

            // Valor por defecto: S/ 2.00 por día
            return 2.00m;
        }

        public int CorregirMultasPrestamosDevueltos()
        {
            try
            {
                return _multaRepository.CorregirMultasPrestamosDevueltos();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al corregir multas de préstamos devueltos: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                return 0;
            }
        }
    }
}
