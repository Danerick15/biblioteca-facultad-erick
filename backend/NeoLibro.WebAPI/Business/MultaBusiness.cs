using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Multas
    /// Maneja todas las operaciones de lógica de negocio para multas
    /// </summary>
    public class MultaBusiness : IMultaBusiness
    {
        private readonly IMultaRepository _multaRepository;

        public MultaBusiness(IMultaRepository multaRepository)
        {
            _multaRepository = multaRepository;
        }

        public List<Multa> ListarMultasPorUsuario(int usuarioId)
        {
            return _multaRepository.ListarMultasPorUsuario(usuarioId);
        }

        public List<Multa> ListarMultasPendientes()
        {
            return _multaRepository.ListarMultasPendientes();
        }

        public List<Multa> ListarMultasPendientesPorUsuario(int usuarioId)
        {
            return _multaRepository.ListarMultasPendientesPorUsuario(usuarioId);
        }

        public ResumenMultasDTO ObtenerResumenMultasUsuario(int usuarioId)
        {
            return _multaRepository.ObtenerResumenMultasUsuario(usuarioId);
        }

        public bool CrearMulta(int prestamoId, int usuarioId, decimal monto, string? motivo = null, int? diasAtraso = null)
        {
            // Validaciones de negocio
            if (prestamoId <= 0 || usuarioId <= 0)
                return false;

            if (monto <= 0)
                return false;

            // Crear la multa
            var multa = new Multa
            {
                PrestamoID = prestamoId,
                UsuarioID = usuarioId,
                Monto = monto,
                Estado = "Pendiente",
                Motivo = motivo,
                DiasAtraso = diasAtraso
            };

            return _multaRepository.Crear(multa);
        }

        public bool PagarMulta(int multaId, string? observaciones = null)
        {
            // Validaciones de negocio
            if (multaId <= 0)
                return false;

            // Verificar que la multa existe y está pendiente
            var multa = _multaRepository.ObtenerPorId(multaId);
            if (multa == null || multa.Estado != "Pendiente")
                return false;

            return _multaRepository.PagarMulta(multaId, observaciones);
        }

        public Multa? ObtenerPorId(int multaId)
        {
            return _multaRepository.ObtenerPorId(multaId);
        }

        public bool TieneMultasPendientes(int usuarioId)
        {
            return _multaRepository.TieneMultasPendientes(usuarioId);
        }
    }
}
