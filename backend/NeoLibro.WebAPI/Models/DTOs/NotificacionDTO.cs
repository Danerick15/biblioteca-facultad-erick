using System;

namespace NeoLibroAPI.Models.DTOs
{
    public class NotificacionDTO
    {
        public int NotificacionID { get; set; }
        public int ReservaID { get; set; }
        public int UsuarioID { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaLectura { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string? LibroTitulo { get; set; }
        public string? NombreUsuario { get; set; }
    }
}