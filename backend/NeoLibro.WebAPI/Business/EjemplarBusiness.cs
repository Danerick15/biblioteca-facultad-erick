using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Ejemplares
    /// Maneja todas las operaciones de lógica de negocio para ejemplares
    /// </summary>
    public class EjemplarBusiness : IEjemplarBusiness
    {
        private readonly IEjemplarRepository _ejemplarRepository;

        public EjemplarBusiness(IEjemplarRepository ejemplarRepository)
        {
            _ejemplarRepository = ejemplarRepository;
        }

        public List<Ejemplar> Listar()
        {
            return _ejemplarRepository.Listar();
        }

        public List<Ejemplar> ListarPorLibro(int libroId)
        {
            return _ejemplarRepository.ListarPorLibro(libroId);
        }

        public Ejemplar? ObtenerPorId(int id)
        {
            return _ejemplarRepository.ObtenerPorId(id);
        }

        public Ejemplar? ObtenerPorCodigoBarras(string codigoBarras)
        {
            return _ejemplarRepository.ObtenerPorCodigoBarras(codigoBarras);
        }

        public bool Crear(Ejemplar ejemplar)
        {
            // Validaciones de negocio
            if (ejemplar.LibroID <= 0)
                return false;

            if (string.IsNullOrEmpty(ejemplar.CodigoBarras))
                return false;

            // Verificar que el código de barras sea único
            if (_ejemplarRepository.ExisteCodigoBarras(ejemplar.CodigoBarras))
                return false;

            // Asignar número de ejemplar automáticamente si no se especifica
            if (ejemplar.NumeroEjemplar <= 0)
            {
                ejemplar.NumeroEjemplar = _ejemplarRepository.ObtenerSiguienteNumeroEjemplar(ejemplar.LibroID);
            }

            // Establecer valores por defecto
            if (string.IsNullOrEmpty(ejemplar.Estado))
                ejemplar.Estado = "Disponible";

            if (ejemplar.FechaAlta == DateTime.MinValue)
                ejemplar.FechaAlta = DateTime.Now;

            return _ejemplarRepository.Crear(ejemplar);
        }

        public bool Modificar(Ejemplar ejemplar)
        {
            // Validaciones de negocio
            if (ejemplar.EjemplarID <= 0)
                return false;

            if (string.IsNullOrEmpty(ejemplar.CodigoBarras))
                return false;

            // Verificar que el código de barras sea único (excluyendo el ejemplar actual)
            var ejemplarExistente = _ejemplarRepository.ObtenerPorId(ejemplar.EjemplarID);
            if (ejemplarExistente != null && ejemplarExistente.CodigoBarras != ejemplar.CodigoBarras)
            {
                if (_ejemplarRepository.ExisteCodigoBarras(ejemplar.CodigoBarras))
                    return false;
            }

            return _ejemplarRepository.Modificar(ejemplar);
        }

        public bool Eliminar(int id)
        {
            return _ejemplarRepository.Eliminar(id);
        }

        public bool CambiarEstado(int ejemplarId, string nuevoEstado)
        {
            var ejemplar = _ejemplarRepository.ObtenerPorId(ejemplarId);
            if (ejemplar == null)
                return false;

            // Validar que el estado sea válido
            var estadosValidos = new[] { "Disponible", "Prestado", "Reservado", "Reparacion", "Extraviado", "Baja" };
            if (!estadosValidos.Contains(nuevoEstado))
                return false;

            ejemplar.Estado = nuevoEstado;
            return _ejemplarRepository.Modificar(ejemplar);
        }

        public List<Ejemplar> ObtenerEjemplaresDisponibles(int libroId)
        {
            var ejemplares = _ejemplarRepository.ListarPorLibro(libroId);
            return ejemplares.Where(e => e.Estado == "Disponible").ToList();
        }

        public int ContarEjemplaresDisponibles(int libroId)
        {
            var ejemplares = _ejemplarRepository.ListarPorLibro(libroId);
            return ejemplares.Count(e => e.Estado == "Disponible");
        }

        public int ContarEjemplaresTotales(int libroId)
        {
            var ejemplares = _ejemplarRepository.ListarPorLibro(libroId);
            return ejemplares.Count(e => e.Estado != "Baja");
        }
    }
}
