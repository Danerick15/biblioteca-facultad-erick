using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Préstamos
    /// Define el contrato para las operaciones de lógica de negocio de préstamos
    /// </summary>
    public interface IPrestamoBusiness
    {
        /// <summary>
        /// Obtiene todos los préstamos activos con información completa
        /// </summary>
        /// <returns>Lista de préstamos activos con información de usuario, libro y ejemplar</returns>
        List<PrestamoDTO> ListarPrestamosActivos();

        /// <summary>
        /// Obtiene todos los préstamos de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista de préstamos del usuario</returns>
        List<PrestamoDTO> ListarPrestamosPorUsuario(int usuarioId);

        /// <summary>
        /// Obtiene todos los préstamos atrasados
        /// </summary>
        /// <returns>Lista de préstamos atrasados</returns>
        List<PrestamoDTO> ListarPrestamosAtrasados();

        /// <summary>
        /// Obtiene el historial completo de préstamos de un usuario
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista completa del historial de préstamos</returns>
        List<PrestamoDTO> ObtenerHistorialCompletoUsuario(int usuarioId);

        /// <summary>
        /// Obtiene los préstamos activos de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista de préstamos activos del usuario</returns>
        List<PrestamoDTO> ListarPrestamosActivosPorUsuario(int usuarioId);

        /// <summary>
        /// Crea un nuevo préstamo con validaciones de negocio
        /// </summary>
        /// <param name="ejemplarId">ID del ejemplar</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <param name="diasPrestamo">Días de duración del préstamo</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool CrearPrestamo(int ejemplarId, int usuarioId, int diasPrestamo = 15);

        /// <summary>
        /// Procesa la devolución de un préstamo con validaciones de negocio
        /// </summary>
        /// <param name="prestamoId">ID del préstamo</param>
        /// <param name="observaciones">Observaciones de la devolución</param>
        /// <returns>True si se procesó exitosamente, False si no</returns>
        bool ProcesarDevolucion(int prestamoId, string? observaciones = null);

        /// <summary>
        /// Renueva un préstamo existente con validaciones de negocio
        /// </summary>
        /// <param name="prestamoId">ID del préstamo</param>
        /// <param name="diasAdicionales">Días adicionales para la renovación</param>
        /// <returns>True si se renovó exitosamente, False si no</returns>
        bool RenovarPrestamo(int prestamoId, int diasAdicionales = 15);

        /// <summary>
        /// Obtiene un préstamo por su ID
        /// </summary>
        /// <param name="prestamoId">ID del préstamo</param>
        /// <returns>Préstamo encontrado o null si no existe</returns>
        Prestamo? ObtenerPorId(int prestamoId);
    }
}
