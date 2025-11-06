using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Libros
    /// Maneja todas las operaciones de lógica de negocio para libros
    /// </summary>
    public class LibroBusiness : ILibroBusiness
    {
        private readonly ILibroRepository _libroRepository;

        public LibroBusiness(ILibroRepository libroRepository)
        {
            _libroRepository = libroRepository;
        }

        public List<LibroDTO> Listar()
        {
            return _libroRepository.Listar();
        }

        public LibroDTO? ObtenerPorId(int id)
        {
            return _libroRepository.ObtenerPorId(id);
        }

        public bool Crear(Libro libro)
        {
            return _libroRepository.Crear(libro);
        }

        public bool Modificar(Libro libro)
        {
            return _libroRepository.Modificar(libro);
        }

        public bool Eliminar(int id)
        {
            return _libroRepository.Eliminar(id);
        }

        public List<LibroDTO> Buscar(string? autor, string? titulo)
        {
            return _libroRepository.Buscar(autor, titulo);
        }
    }
}
