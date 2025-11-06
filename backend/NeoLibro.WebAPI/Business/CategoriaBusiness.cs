using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Categorías
    /// Maneja todas las operaciones de lógica de negocio para categorías
    /// </summary>
    public class CategoriaBusiness : ICategoriaBusiness
    {
        private readonly ICategoriaRepository _categoriaRepository;

        public CategoriaBusiness(ICategoriaRepository categoriaRepository)
        {
            _categoriaRepository = categoriaRepository;
        }

        public List<Categoria> Listar()
        {
            return _categoriaRepository.Listar();
        }

        public Categoria? ObtenerPorId(int id)
        {
            return _categoriaRepository.ObtenerPorId(id);
        }

        public Categoria? ObtenerPorNombre(string nombre)
        {
            return _categoriaRepository.ObtenerPorNombre(nombre);
        }

        public bool Crear(Categoria categoria)
        {
            // Validaciones de negocio
            if (categoria == null)
                return false;

            if (string.IsNullOrWhiteSpace(categoria.Nombre))
                return false;

            // Verificar que no exista una categoría con el mismo nombre
            var categoriaExistente = _categoriaRepository.ObtenerPorNombre(categoria.Nombre);
            if (categoriaExistente != null)
                return false;

            return _categoriaRepository.Crear(categoria);
        }

        public bool Modificar(Categoria categoria)
        {
            // Validaciones de negocio
            if (categoria == null)
                return false;

            if (categoria.CategoriaID <= 0)
                return false;

            if (string.IsNullOrWhiteSpace(categoria.Nombre))
                return false;

            // Verificar que la categoría existe
            var categoriaExistente = _categoriaRepository.ObtenerPorId(categoria.CategoriaID);
            if (categoriaExistente == null)
                return false;

            // Verificar que no exista otra categoría con el mismo nombre (excluyendo la actual)
            var categoriaConMismoNombre = _categoriaRepository.ObtenerPorNombre(categoria.Nombre);
            if (categoriaConMismoNombre != null && categoriaConMismoNombre.CategoriaID != categoria.CategoriaID)
                return false;

            return _categoriaRepository.Modificar(categoria);
        }

        public bool Eliminar(int id)
        {
            // Validaciones de negocio
            if (id <= 0)
                return false;

            // Verificar que la categoría existe
            var categoria = _categoriaRepository.ObtenerPorId(id);
            if (categoria == null)
                return false;

            // Verificar que no tenga libros asociados
            if (_categoriaRepository.TieneLibrosAsociados(id))
                return false;

            return _categoriaRepository.Eliminar(id);
        }

        public bool TieneLibrosAsociados(int categoriaId)
        {
            return _categoriaRepository.TieneLibrosAsociados(categoriaId);
        }

        public List<Categoria> BuscarPorNombre(string termino)
        {
            // Validaciones de negocio
            if (string.IsNullOrWhiteSpace(termino))
                return new List<Categoria>();

            return _categoriaRepository.BuscarPorNombre(termino);
        }
    }
}
