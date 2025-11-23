using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Recomendaciones
    /// Maneja todas las operaciones de lógica de negocio para recomendaciones
    /// </summary>
    public class RecomendacionBusiness : IRecomendacionBusiness
    {
        private readonly IRecomendacionRepository _recomendacionRepository;

        public RecomendacionBusiness(IRecomendacionRepository recomendacionRepository)
        {
            _recomendacionRepository = recomendacionRepository;
        }

        public List<RecomendacionDTO> ListarPublicas()
        {
            return _recomendacionRepository.ListarPublicas();
        }

        public List<RecomendacionDTO> ListarPorProfesor(int profesorID)
        {
            return _recomendacionRepository.ListarPorProfesor(profesorID);
        }

        public RecomendacionDTO? ObtenerPorId(int id)
        {
            return _recomendacionRepository.ObtenerPorId(id);
        }

        public bool Crear(Recomendacion recomendacion)
        {
            // Validaciones de negocio
            if (string.IsNullOrWhiteSpace(recomendacion.Curso))
                return false;

            if (!recomendacion.LibroID.HasValue && string.IsNullOrWhiteSpace(recomendacion.URLExterna))
                return false;

            return _recomendacionRepository.Crear(recomendacion);
        }

        public bool Modificar(Recomendacion recomendacion)
        {
            // Validaciones de negocio
            if (string.IsNullOrWhiteSpace(recomendacion.Curso))
                return false;

            if (!recomendacion.LibroID.HasValue && string.IsNullOrWhiteSpace(recomendacion.URLExterna))
                return false;

            return _recomendacionRepository.Modificar(recomendacion);
        }

        public bool Eliminar(int id)
        {
            return _recomendacionRepository.Eliminar(id);
        }
    }
}


