using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NeoLibroAPI.Models.Entities
{
    public class Notificacion
    {
        [Key]
        public int NotificacionID { get; set; }

        [Required]
        public int ReservaID { get; set; }

        [Required]
        public int UsuarioID { get; set; }

        [Required]
        [StringLength(50)]
    public string Tipo { get; set; } = string.Empty; // NuevaReservaParaRetiro, EjemplarDisponible, etc.

        [Required]
        [StringLength(500)]
    public string Mensaje { get; set; } = string.Empty;

        [Required]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime? FechaLectura { get; set; }

        [Required]
        [StringLength(20)]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Leida

        [ForeignKey("ReservaID")]
        public Reserva? Reserva { get; set; }

        [ForeignKey("UsuarioID")]
        public Usuario? Usuario { get; set; }
    }
}