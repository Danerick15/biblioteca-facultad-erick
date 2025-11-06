using NeoLibroAPI.Models.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace NeoLibroAPI.Interfaces
{
    public interface INotificacionRepository
    {
        Task<IEnumerable<Notificacion>> GetNotificacionesPendientesByUsuario(int usuarioId);
        Task<IEnumerable<Notificacion>> GetNotificacionesByUsuario(int usuarioId);
        Task<IEnumerable<Notificacion>> GetNotificacionesByReserva(int reservaId);
        Task<Notificacion> CreateNotificacion(Notificacion notificacion);
        Task<bool> MarcarComoLeida(int notificacionId);
        Task<bool> MarcarTodasComoLeidas(int usuarioId);
        Task<bool> DeleteNotificacion(int notificacionId);
    }
}