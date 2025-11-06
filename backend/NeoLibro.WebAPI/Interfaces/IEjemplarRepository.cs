using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Ejemplares
    /// Define el contrato para las operaciones de acceso a datos de ejemplares
    /// </summary>
    public interface IEjemplarRepository
    {
        /// <summary>
        /// Obtiene todos los ejemplares activos ordenados por libro y número de ejemplar
        /// </summary>
        /// <returns>Lista de todos los ejemplares activos</returns>
        List<Ejemplar> Listar();

        /// <summary>
        /// Obtiene todos los ejemplares de un libro específico
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Lista de ejemplares del libro</returns>
        List<Ejemplar> ListarPorLibro(int libroId);

        /// <summary>
        /// Obtiene un ejemplar por su ID
        /// </summary>
        /// <param name="id">ID del ejemplar</param>
        /// <returns>Ejemplar encontrado o null si no existe</returns>
        Ejemplar? ObtenerPorId(int id);

        /// <summary>
        /// Obtiene un ejemplar por su código de barras
        /// </summary>
        /// <param name="codigoBarras">Código de barras del ejemplar</param>
        /// <returns>Ejemplar encontrado o null si no existe</returns>
        Ejemplar? ObtenerPorCodigoBarras(string codigoBarras);

        /// <summary>
        /// Crea un nuevo ejemplar
        /// </summary>
        /// <param name="ejemplar">Ejemplar a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Ejemplar ejemplar);

        /// <summary>
        /// Modifica un ejemplar existente
        /// </summary>
        /// <param name="ejemplar">Ejemplar con los datos actualizados</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Ejemplar ejemplar);

        /// <summary>
        /// Elimina un ejemplar (cambio de estado a baja)
        /// </summary>
        /// <param name="id">ID del ejemplar a eliminar</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);

        /// <summary>
        /// Obtiene el siguiente número de ejemplar para un libro
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Siguiente número de ejemplar disponible</returns>
        int ObtenerSiguienteNumeroEjemplar(int libroId);

        /// <summary>
        /// Verifica si existe un código de barras en la base de datos
        /// </summary>
        /// <param name="codigoBarras">Código de barras a verificar</param>
        /// <returns>True si existe, False si no</returns>
        bool ExisteCodigoBarras(string codigoBarras);
    }
}
