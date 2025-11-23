using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;

namespace NeoLibroAPI.Business
{
    public class ReservaBusiness : IReservaBusiness
    {
        private readonly IReservaRepository _reservaRepository;
        private readonly IMultaBusiness _multaBusiness;

        public ReservaBusiness(IReservaRepository reservaRepository, IMultaBusiness multaBusiness)
        {
            _reservaRepository = reservaRepository;
            _multaBusiness = multaBusiness;
        }

        public async Task<Reserva> CrearReserva(int usuarioId, int libroId, string tipoReserva, int? ejemplarId = null)
        {
            if (usuarioId <= 0 || libroId <= 0)
                throw new ArgumentException("Usuario y libro son requeridos");

            // Verificar si el usuario tiene multas pendientes
            var tieneMultasPendientes = _multaBusiness.TieneMultasPendientes(usuarioId);
            if (tieneMultasPendientes)
            {
                var multasPendientes = _multaBusiness.ListarMultasPendientesPorUsuario(usuarioId);
                var montoTotal = multasPendientes.Sum(m => m.Monto);
                throw new InvalidOperationException($"No puedes reservar libros porque tienes {multasPendientes.Count} multa(s) pendiente(s) por un total de S/ {montoTotal:F2}. Por favor, paga tus multas antes de realizar una nueva reserva.");
            }

            if (await _reservaRepository.TieneReservasActivas(usuarioId) && tipoReserva == "Retiro")
                throw new InvalidOperationException("El usuario ya tiene una reserva activa");

            return await _reservaRepository.CrearReserva(usuarioId, libroId, tipoReserva, ejemplarId);
        }

        public async Task<IEnumerable<ReservaDTO>> ListarReservasPorUsuario(int usuarioId)
        {
            return await _reservaRepository.ListarReservasPorUsuario(usuarioId);
        }

        public async Task<IEnumerable<AdminReservaDTO>> ListarReservasParaRetiro()
        {
            return await _reservaRepository.ListarReservasParaRetiro();
        }

        public async Task<IEnumerable<AdminReservaDTO>> ListarReservasEnEspera()
        {
            return await _reservaRepository.ListarReservasEnEspera();
        }

        public async Task<bool> CancelarReserva(int reservaId, int usuarioId, bool esAdmin)
        {
            return await _reservaRepository.CancelarReserva(reservaId, usuarioId, esAdmin);
        }

        public async Task<bool> ActualizarTipoReserva(int reservaId, string nuevoTipo)
        {
            if (nuevoTipo != "ColaEspera" && nuevoTipo != "Retiro")
                throw new ArgumentException("Tipo de reserva inválido");

            return await _reservaRepository.ActualizarTipoReserva(reservaId, nuevoTipo);
        }

        public async Task<bool> MarcarComoCompletada(int reservaId)
        {
            return await _reservaRepository.MarcarComoCompletada(reservaId);
        }

        public async Task<int> ObtenerPosicionEnCola(int libroId, int reservaId)
        {
            return await _reservaRepository.ObtenerPosicionEnCola(libroId, reservaId);
        }

        public async Task<int> AprobarReserva(int reservaId, int administradorId)
        {
            return await _reservaRepository.AprobarReserva(reservaId, administradorId);
        }

        public async Task<bool> ExpirarReserva(int reservaId)
        {
            return await _reservaRepository.ExpirarReserva(reservaId);
        }
    }
}


