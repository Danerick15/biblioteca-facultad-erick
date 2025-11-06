using System;

namespace NeoLibroAPI.Models.DTOs
{
    public class ReservaDTO
    {
        public int ReservaID { get; set; }
        public int UsuarioID { get; set; }
        public int LibroID { get; set; }
        public string LibroTitulo { get; set; } = string.Empty;
        public string? LibroISBN { get; set; }
        public DateTime FechaReserva { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string TipoReserva { get; set; } = string.Empty;
        public DateTime? FechaLimiteRetiro { get; set; }
        public int? PosicionCola { get; set; }
        public string? NombreUsuario { get; set; }
        public string? CodigoUsuario { get; set; }
    }
}

