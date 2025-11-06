using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Autores
    /// Maneja todas las operaciones de lógica de negocio para autores
    /// </summary>
    public class AutorBusiness : IAutorBusiness
    {
        private readonly IAutorRepository _autorRepository;

        public AutorBusiness(IAutorRepository autorRepository)
        {
            _autorRepository = autorRepository;
        }

        public List<Autor> Listar()
        {
            return _autorRepository.Listar();
        }

        public Autor? ObtenerPorId(int id)
        {
            return _autorRepository.ObtenerPorId(id);
        }

        public Autor? ObtenerPorNombre(string nombre)
        {
            return _autorRepository.ObtenerPorNombre(nombre);
        }

        public bool Crear(Autor autor)
        {
            // Validaciones de negocio
            if (autor == null)
                return false;

            if (string.IsNullOrWhiteSpace(autor.Nombre))
                return false;

            // Verificar que no exista un autor con el mismo nombre
            var autorExistente = _autorRepository.ObtenerPorNombre(autor.Nombre);
            if (autorExistente != null)
                return false;

            return _autorRepository.Crear(autor);
        }

        public bool Modificar(Autor autor)
        {
            // Validaciones de negocio
            if (autor == null)
                return false;

            if (autor.AutorID <= 0)
                return false;

            if (string.IsNullOrWhiteSpace(autor.Nombre))
                return false;

            // Verificar que el autor existe
            var autorExistente = _autorRepository.ObtenerPorId(autor.AutorID);
            if (autorExistente == null)
                return false;

            // Verificar que no exista otro autor con el mismo nombre (excluyendo el actual)
            var autorConMismoNombre = _autorRepository.ObtenerPorNombre(autor.Nombre);
            if (autorConMismoNombre != null && autorConMismoNombre.AutorID != autor.AutorID)
                return false;

            return _autorRepository.Modificar(autor);
        }

        public bool Eliminar(int id)
        {
            // Validaciones de negocio
            if (id <= 0)
                return false;

            // Verificar que el autor existe
            var autor = _autorRepository.ObtenerPorId(id);
            if (autor == null)
                return false;

            // Verificar que no tenga libros asociados
            if (_autorRepository.TieneLibrosAsociados(id))
                return false;

            return _autorRepository.Eliminar(id);
        }

        public bool TieneLibrosAsociados(int autorId)
        {
            return _autorRepository.TieneLibrosAsociados(autorId);
        }

        public List<Autor> BuscarPorNombre(string termino)
        {
            // Validaciones de negocio
            if (string.IsNullOrWhiteSpace(termino))
                return new List<Autor>();

            return _autorRepository.BuscarPorNombre(termino);
        }
    }
}
