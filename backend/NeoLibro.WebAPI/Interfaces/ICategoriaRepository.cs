using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Categorías
    /// Define el contrato para las operaciones de acceso a datos de categorías
    /// </summary>
    public interface ICategoriaRepository
    {
        /// <summary>
        /// Obtiene todas las categorías ordenadas por nombre
        /// </summary>
        /// <returns>Lista de todas las categorías</returns>
        List<Categoria> Listar();

        /// <summary>
        /// Obtiene una categoría por su ID
        /// </summary>
        /// <param name="id">ID de la categoría</param>
        /// <returns>Categoría encontrada o null si no existe</returns>
        Categoria? ObtenerPorId(int id);

        /// <summary>
        /// Obtiene una categoría por su nombre
        /// </summary>
        /// <param name="nombre">Nombre de la categoría</param>
        /// <returns>Categoría encontrada o null si no existe</returns>
        Categoria? ObtenerPorNombre(string nombre);

        /// <summary>
        /// Crea una nueva categoría
        /// </summary>
        /// <param name="categoria">Datos de la categoría</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Categoria categoria);

        /// <summary>
        /// Modifica una categoría existente
        /// </summary>
        /// <param name="categoria">Datos de la categoría a modificar</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Categoria categoria);

        /// <summary>
        /// Elimina una categoría si no está asociada a libros
        /// </summary>
        /// <param name="id">ID de la categoría</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);

        /// <summary>
        /// Verifica si una categoría está asociada a algún libro
        /// </summary>
        /// <param name="categoriaId">ID de la categoría</param>
        /// <returns>True si está asociada a libros, False si no</returns>
        bool TieneLibrosAsociados(int categoriaId);

        /// <summary>
        /// Busca categorías por nombre (búsqueda parcial)
        /// </summary>
        /// <param name="termino">Término de búsqueda</param>
        /// <returns>Lista de categorías que coinciden con el término</returns>
        List<Categoria> BuscarPorNombre(string termino);
    }
}
