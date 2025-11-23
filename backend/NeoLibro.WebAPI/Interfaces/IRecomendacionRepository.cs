using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Recomendaciones
    /// Define el contrato para las operaciones de acceso a datos de recomendaciones
    /// </summary>
    public interface IRecomendacionRepository
    {
        /// <summary>
        /// Obtiene todas las recomendaciones públicas (para estudiantes)
        /// </summary>
        /// <returns>Lista de recomendaciones con información completa</returns>
        List<RecomendacionDTO> ListarPublicas();

        /// <summary>
        /// Obtiene todas las recomendaciones de un profesor específico
        /// </summary>
        /// <param name="profesorID">ID del profesor</param>
        /// <returns>Lista de recomendaciones del profesor</returns>
        List<RecomendacionDTO> ListarPorProfesor(int profesorID);

        /// <summary>
        /// Obtiene una recomendación por su ID
        /// </summary>
        /// <param name="id">ID de la recomendación</param>
        /// <returns>Recomendación encontrada o null si no existe</returns>
        RecomendacionDTO? ObtenerPorId(int id);

        /// <summary>
        /// Crea una nueva recomendación
        /// </summary>
        /// <param name="recomendacion">Recomendación a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Recomendacion recomendacion);

        /// <summary>
        /// Modifica una recomendación existente
        /// </summary>
        /// <param name="recomendacion">Recomendación con los datos actualizados</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Recomendacion recomendacion);

        /// <summary>
        /// Elimina una recomendación
        /// </summary>
        /// <param name="id">ID de la recomendación a eliminar</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);
    }
}


