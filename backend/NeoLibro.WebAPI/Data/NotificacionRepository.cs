using Microsoft.EntityFrameworkCore;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NeoLibroAPI.Data
{
    public class NotificacionRepository : INotificacionRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificacionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Notificacion>> GetNotificacionesPendientesByUsuario(int usuarioId)
        {
            return await _context.Notificaciones
                .Where(n => n.UsuarioID == usuarioId && n.Estado == "Pendiente")
                .OrderByDescending(n => n.FechaCreacion)
                .ToListAsync();
        }

        public async Task<IEnumerable<Notificacion>> GetNotificacionesByUsuario(int usuarioId)
        {
            return await _context.Notificaciones
                .Where(n => n.UsuarioID == usuarioId)
                .OrderByDescending(n => n.FechaCreacion)
                .ToListAsync();
        }

        public async Task<IEnumerable<Notificacion>> GetNotificacionesByReserva(int reservaId)
        {
            return await _context.Notificaciones
                .Where(n => n.ReservaID == reservaId)
                .OrderByDescending(n => n.FechaCreacion)
                .ToListAsync();
        }

        public async Task<Notificacion> CreateNotificacion(Notificacion notificacion)
        {
            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();
            return notificacion;
        }

        public async Task<bool> MarcarComoLeida(int notificacionId)
        {
            var notificacion = await _context.Notificaciones.FindAsync(notificacionId);
            if (notificacion == null)
                return false;

            notificacion.Estado = "Leida";
            notificacion.FechaLectura = System.DateTime.Now;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarcarTodasComoLeidas(int usuarioId)
        {
            var notificaciones = await _context.Notificaciones
                .Where(n => n.UsuarioID == usuarioId && n.Estado == "Pendiente")
                .ToListAsync();

            foreach (var notificacion in notificaciones)
            {
                notificacion.Estado = "Leida";
                notificacion.FechaLectura = System.DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteNotificacion(int notificacionId)
        {
            var notificacion = await _context.Notificaciones.FindAsync(notificacionId);
            if (notificacion == null)
                return false;

            _context.Notificaciones.Remove(notificacion);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}