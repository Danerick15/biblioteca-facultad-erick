using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Multas
    /// Define el contrato para las operaciones de acceso a datos de multas
    /// </summary>
    public interface IMultaRepository
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
        /// Crea una nueva multa
        /// </summary>
        /// <param name="multa">Datos de la multa</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Multa multa);

        /// <summary>
        /// Marca una multa como pagada
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
