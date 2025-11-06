using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para la lógica de negocio de Libros
    /// Define el contrato para las operaciones de lógica de negocio de libros
    /// </summary>
    public interface ILibroBusiness
    {
        /// <summary>
        /// Obtiene todos los libros con información completa
        /// </summary>
        /// <returns>Lista de libros con información de ejemplares, autores y categorías</returns>
        List<LibroDTO> Listar();

        /// <summary>
        /// Obtiene un libro por su ID con información completa
        /// </summary>
        /// <param name="id">ID del libro</param>
        /// <returns>Libro encontrado o null si no existe</returns>
        LibroDTO? ObtenerPorId(int id);

        /// <summary>
        /// Crea un nuevo libro con sus relaciones
        /// </summary>
        /// <param name="libro">Libro a crear</param>
        /// <returns>True si se creó exitosamente, False si no</returns>
        bool Crear(Libro libro);

        /// <summary>
        /// Modifica un libro existente y actualiza sus relaciones
        /// </summary>
        /// <param name="libro">Libro con los datos actualizados</param>
        /// <returns>True si se modificó exitosamente, False si no</returns>
        bool Modificar(Libro libro);

        /// <summary>
        /// Elimina un libro (marca ejemplares como baja)
        /// </summary>
        /// <param name="id">ID del libro a eliminar</param>
        /// <returns>True si se eliminó exitosamente, False si no</returns>
        bool Eliminar(int id);

        /// <summary>
        /// Busca libros por autor y/o título
        /// </summary>
        /// <param name="autor">Nombre del autor (opcional)</param>
        /// <param name="titulo">Título del libro (opcional)</param>
        /// <returns>Lista de libros que coinciden con los criterios</returns>
        List<LibroDTO> Buscar(string? autor, string? titulo);
    }
}
