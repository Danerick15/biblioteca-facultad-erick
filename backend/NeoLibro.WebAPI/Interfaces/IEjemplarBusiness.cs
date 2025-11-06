using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Ejemplares
    /// Define el contrato para las operaciones de lógica de negocio de ejemplares
    /// </summary>
    public interface IEjemplarBusiness
    {
        /// <summary>
        /// Obtiene todos los ejemplares activos
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
        /// Crea un nuevo ejemplar con validaciones de negocio
        /// </summary>
        /// <param name="ejemplar">Ejemplar a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Ejemplar ejemplar);

        /// <summary>
        /// Modifica un ejemplar existente con validaciones de negocio
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
        /// Cambia el estado de un ejemplar
        /// </summary>
        /// <param name="ejemplarId">ID del ejemplar</param>
        /// <param name="nuevoEstado">Nuevo estado del ejemplar</param>
        /// <returns>True si se cambió exitosamente, False si no</returns>
        bool CambiarEstado(int ejemplarId, string nuevoEstado);

        /// <summary>
        /// Obtiene los ejemplares disponibles de un libro
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Lista de ejemplares disponibles</returns>
        List<Ejemplar> ObtenerEjemplaresDisponibles(int libroId);

        /// <summary>
        /// Cuenta los ejemplares disponibles de un libro
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Número de ejemplares disponibles</returns>
        int ContarEjemplaresDisponibles(int libroId);

        /// <summary>
        /// Cuenta el total de ejemplares de un libro (excluyendo bajas)
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Número total de ejemplares</returns>
        int ContarEjemplaresTotales(int libroId);
    }
}
