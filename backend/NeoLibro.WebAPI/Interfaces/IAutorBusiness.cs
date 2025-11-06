using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Autores
    /// Define el contrato para las operaciones de lógica de negocio de autores
    /// </summary>
    public interface IAutorBusiness
    {
        /// <summary>
        /// Obtiene todos los autores ordenados por nombre
        /// </summary>
        /// <returns>Lista de todos los autores</returns>
        List<Autor> Listar();

        /// <summary>
        /// Obtiene un autor por su ID
        /// </summary>
        /// <param name="id">ID del autor</param>
        /// <returns>Autor encontrado o null si no existe</returns>
        Autor? ObtenerPorId(int id);

        /// <summary>
        /// Obtiene un autor por su nombre
        /// </summary>
        /// <param name="nombre">Nombre del autor</param>
        /// <returns>Autor encontrado o null si no existe</returns>
        Autor? ObtenerPorNombre(string nombre);

        /// <summary>
        /// Crea un nuevo autor con validaciones de negocio
        /// </summary>
        /// <param name="autor">Datos del autor</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Autor autor);

        /// <summary>
        /// Modifica un autor existente con validaciones de negocio
        /// </summary>
        /// <param name="autor">Datos del autor a modificar</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Autor autor);

        /// <summary>
        /// Elimina un autor si no está asociado a libros
        /// </summary>
        /// <param name="id">ID del autor</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);

        /// <summary>
        /// Verifica si un autor está asociado a algún libro
        /// </summary>
        /// <param name="autorId">ID del autor</param>
        /// <returns>True si está asociado a libros, False si no</returns>
        bool TieneLibrosAsociados(int autorId);

        /// <summary>
        /// Busca autores por nombre (búsqueda parcial)
        /// </summary>
        /// <param name="termino">Término de búsqueda</param>
        /// <returns>Lista de autores que coinciden con el término</returns>
        List<Autor> BuscarPorNombre(string termino);
    }
}
