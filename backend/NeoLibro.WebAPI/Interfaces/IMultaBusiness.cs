using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Multas
    /// Define el contrato para las operaciones de lógica de negocio de multas
    /// </summary>
    public interface IMultaBusiness
    {
        /// <summary>
        /// Obtiene todas las multas de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista de multas del usuario</returns>
        List<Multa> ListarMultasPorUsuario(int usuarioId);

        /// <summary>
        /// Obtiene todas las multas pendientes
        /// </summary>
        /// <returns>Lista de multas pendientes</returns>
        List<Multa> ListarMultasPendientes();

        /// <summary>
        /// Obtiene las multas pendientes de un usuario específico
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Lista de multas pendientes del usuario</returns>
        List<Multa> ListarMultasPendientesPorUsuario(int usuarioId);

        /// <summary>
        /// Obtiene un resumen de multas de un usuario
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>Resumen de multas del usuario</returns>
        ResumenMultasDTO ObtenerResumenMultasUsuario(int usuarioId);

        /// <summary>
        /// Crea una nueva multa con validaciones de negocio
        /// </summary>
        /// <param name="prestamoId">ID del préstamo</param>
        /// <param name="usuarioId">ID del usuario</param>
        /// <param name="monto">Monto de la multa</param>
        /// <param name="motivo">Motivo de la multa</param>
        /// <param name="diasAtraso">Días de atraso</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool CrearMulta(int prestamoId, int usuarioId, decimal monto, string? motivo = null, int? diasAtraso = null);

        /// <summary>
        /// Marca una multa como pagada con validaciones de negocio
        /// </summary>
        /// <param name="multaId">ID de la multa</param>
        /// <param name="observaciones">Observaciones del pago</param>
        /// <returns>True si se pagó exitosamente, False si no</returns>
        bool PagarMulta(int multaId, string? observaciones = null);

        /// <summary>
        /// Obtiene una multa por su ID
        /// </summary>
        /// <param name="multaId">ID de la multa</param>
        /// <returns>Multa encontrada o null si no existe</returns>
        Multa? ObtenerPorId(int multaId);

        /// <summary>
        /// Verifica si un usuario tiene multas pendientes
        /// </summary>
        /// <param name="usuarioId">ID del usuario</param>
        /// <returns>True si tiene multas pendientes, False si no</returns>
        bool TieneMultasPendientes(int usuarioId);
    }
}
