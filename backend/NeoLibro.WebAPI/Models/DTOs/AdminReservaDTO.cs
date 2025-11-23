using System;

namespace NeoLibroAPI.Models.DTOs
{
    public class AdminReservaDTO
    {
        public int ReservaID { get; set; }
        public int? UsuarioID { get; set; }
        public string? NombreUsuario { get; set; }
        // Campo adicional con convención esperada por el frontend (usuarioNombre)
        public string? UsuarioNombre { get; set; }
        public string? CodigoUsuario { get; set; }
        public int? LibroID { get; set; }
        public string? LibroTitulo { get; set; }
        public DateTime? FechaReserva { get; set; }
        public string? TipoReserva { get; set; }
        public string? Estado { get; set; }
        public int? PosicionCola { get; set; }
        // Información del ejemplar asignado
        public int? NumeroEjemplar { get; set; }
        public string? CodigoBarras { get; set; }
    }
}