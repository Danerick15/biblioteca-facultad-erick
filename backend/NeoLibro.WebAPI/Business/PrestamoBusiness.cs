using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Préstamos
    /// Maneja todas las operaciones de lógica de negocio para préstamos
    /// </summary>
    public class PrestamoBusiness : IPrestamoBusiness
    {
        private readonly IPrestamoRepository _prestamoRepository;

        public PrestamoBusiness(IPrestamoRepository prestamoRepository)
        {
            _prestamoRepository = prestamoRepository;
        }

        public List<PrestamoDTO> ListarPrestamosActivos()
        {
            return _prestamoRepository.ListarPrestamosActivos();
        }

        public List<PrestamoDTO> ListarPrestamosPorUsuario(int usuarioId)
        {
            return _prestamoRepository.ListarPrestamosPorUsuario(usuarioId);
        }

        public List<PrestamoDTO> ListarPrestamosAtrasados()
        {
            return _prestamoRepository.ListarPrestamosAtrasados();
        }

        public List<PrestamoDTO> ObtenerHistorialCompletoUsuario(int usuarioId)
        {
            return _prestamoRepository.ObtenerHistorialCompletoUsuario(usuarioId);
        }

        public List<PrestamoDTO> ListarPrestamosActivosPorUsuario(int usuarioId)
        {
            return _prestamoRepository.ListarPrestamosActivosPorUsuario(usuarioId);
        }

        public bool CrearPrestamo(int ejemplarId, int usuarioId, int diasPrestamo = 15)
        {
            // Validaciones de negocio
            if (ejemplarId <= 0 || usuarioId <= 0)
                return false;

            if (diasPrestamo <= 0 || diasPrestamo > 30) // Máximo 30 días
                return false;

            return _prestamoRepository.CrearPrestamo(ejemplarId, usuarioId, diasPrestamo);
        }

        public bool ProcesarDevolucion(int prestamoId, string? observaciones = null)
        {
            // Validaciones de negocio
            if (prestamoId <= 0)
                return false;

            return _prestamoRepository.ProcesarDevolucion(prestamoId, observaciones);
        }

        public bool RenovarPrestamo(int prestamoId, int diasAdicionales = 15)
        {
            // Validaciones de negocio
            if (prestamoId <= 0)
                return false;

            if (diasAdicionales <= 0 || diasAdicionales > 15) // Máximo 15 días adicionales
                return false;

            // Verificar que el préstamo existe y está activo
            var prestamo = _prestamoRepository.ObtenerPorId(prestamoId);
            if (prestamo == null || prestamo.Estado != "Prestado")
                return false;

            return _prestamoRepository.RenovarPrestamo(prestamoId, diasAdicionales);
        }

        public Prestamo? ObtenerPorId(int prestamoId)
        {
            return _prestamoRepository.ObtenerPorId(prestamoId);
        }
    }
}
