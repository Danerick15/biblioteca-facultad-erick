using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Interfaces
{
    public interface IReservaBusiness
    {
        Task<Reserva> CrearReserva(int usuarioId, int libroId, string tipoReserva, int? ejemplarId = null);
        Task<IEnumerable<ReservaDTO>> ListarReservasPorUsuario(int usuarioId);
        Task<IEnumerable<AdminReservaDTO>> ListarReservasParaRetiro();
        Task<IEnumerable<AdminReservaDTO>> ListarReservasEnEspera();
        Task<bool> CancelarReserva(int reservaId, int usuarioId, bool esAdmin);
        Task<bool> ActualizarTipoReserva(int reservaId, string nuevoTipo);
        Task<bool> MarcarComoCompletada(int reservaId);
        Task<int> ObtenerPosicionEnCola(int libroId, int reservaId);
    Task<int> AprobarReserva(int reservaId, int administradorId);
        Task<bool> ExpirarReserva(int reservaId);
    }
}


