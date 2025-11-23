using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    /// <summary>
    /// Interface para el repositorio de Libros
    /// Define el contrato para las operaciones de acceso a datos de libros
    /// </summary>
    public interface ILibroRepository
    {
        /// <summary>
        /// Obtiene todos los libros con información de ejemplares, autores y categorías
        /// </summary>
        /// <returns>Lista de libros con información completa</returns>
        List<LibroDTO> Listar();

        /// <summary>
        /// Obtiene un libro por su ID con información completa
        /// </summary>
        /// <param name="id">ID del libro</param>
        /// <returns>Libro encontrado o null si no existe</returns>
        LibroDTO? ObtenerPorId(int id);

        /// <summary>
        /// Crea un nuevo libro con sus relaciones (autores y categorías)
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
        /// Busca libros por autor, título y/o palabra clave
        /// </summary>
        /// <param name="autor">Nombre del autor (opcional)</param>
        /// <param name="titulo">Título del libro (opcional)</param>
        /// <param name="palabraClave">Palabra clave para buscar en título, editorial, ISBN o categorías (opcional)</param>
        /// <returns>Lista de libros que coinciden con los criterios</returns>
        List<LibroDTO> Buscar(string? autor, string? titulo, string? palabraClave);

        /// <summary>
        /// Obtiene los nombres de los autores de un libro específico
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Lista de nombres de autores</returns>
        List<string> ObtenerAutoresPorLibro(int libroId);

        /// <summary>
        /// Obtiene los nombres de las categorías de un libro específico
        /// </summary>
        /// <param name="libroId">ID del libro</param>
        /// <returns>Lista de nombres de categorías</returns>
        List<string> ObtenerCategoriasPorLibro(int libroId);

        // Métodos para archivos digitales (HU-10)
        
        /// <summary>
        /// Actualiza la información del archivo digital de un libro
        /// </summary>
        bool ActualizarArchivoDigital(int libroID, string rutaArchivo, string tipoArchivo, long tamañoArchivo);
        
        /// <summary>
        /// Elimina el archivo digital de un libro
        /// </summary>
        bool EliminarArchivoDigital(int libroID);
        
        /// <summary>
        /// Registra un log de acceso a un archivo digital
        /// </summary>
        bool RegistrarLogAcceso(int libroID, int usuarioID, string tipoAcceso, string? ipAcceso, string? userAgent);
        
        /// <summary>
        /// Incrementa el contador de vistas de un libro
        /// </summary>
        bool IncrementarContadorVistas(int libroID);
        
        /// <summary>
        /// Incrementa el contador de descargas de un libro
        /// </summary>
        bool IncrementarContadorDescargas(int libroID);
        
        /// <summary>
        /// Obtiene la ruta del archivo digital de un libro
        /// </summary>
        string? ObtenerRutaArchivoDigital(int libroID);
    }
}
