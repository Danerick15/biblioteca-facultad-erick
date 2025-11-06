using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NeoLibroAPI.Interfaces
{
    public interface IReservaRepository
    {
        Task<Reserva> CrearReserva(int usuarioId, int libroId, string tipoReserva, int? ejemplarId = null);
        Task<IEnumerable<ReservaDTO>> ListarReservasPorUsuario(int usuarioId);
        Task<IEnumerable<AdminReservaDTO>> ListarReservasParaRetiro();
        Task<IEnumerable<AdminReservaDTO>> ListarReservasEnEspera();
        Task<bool> CancelarReserva(int reservaId, int usuarioId, bool esAdmin);
        Task<bool> ActualizarTipoReserva(int reservaId, string nuevoTipo);
        Task<bool> MarcarComoCompletada(int reservaId);
        Task<int> ObtenerPosicionEnCola(int libroId, int reservaId);
        Task<bool> ProcesarColaEspera(int libroId);
        Task<DateTime> CalcularFechaLimiteRetiro(int libroId);
        Task<bool> ExisteReservaActiva(int usuarioId, int libroId);
        Task<bool> TieneReservasActivas(int usuarioId);
    Task<int> AprobarReserva(int reservaId, int administradorId);
    Task<bool> ExpirarReserva(int reservaId);
    }
}
