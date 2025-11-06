using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NeoLibroAPI.Models.Entities
{
    public class Reserva
    {
        [Key]
        public int ReservaID { get; set; }

        [Required]
        public int LibroID { get; set; }

        [Required]
        public int UsuarioID { get; set; }

        public int? EjemplarID { get; set; }

        [Required]
        public DateTime FechaReserva { get; set; } = DateTime.Now;

    [Required]
    [StringLength(20)]
    public string Estado { get; set; } = NeoLibroAPI.Models.ReservaEstados.ColaEspera; // Valores: ColaEspera, PorAprobar, Aprobada, Completada, Cancelada, Expirada

        [Required]
        [StringLength(20)]
        public string TipoReserva { get; set; } = "ColaEspera"; // ColaEspera, Retiro

        [Required]
        [StringLength(20)]
        public string EstadoNotificacion { get; set; } = "Pendiente"; // Pendiente, Enviada, Leida

        public DateTime? FechaLimiteRetiro { get; set; }

        public int? PrioridadCola { get; set; } = 1;

        [ForeignKey("LibroID")]
        public virtual Libro Libro { get; set; }

        [ForeignKey("UsuarioID")]
        public virtual Usuario Usuario { get; set; }

        [ForeignKey("EjemplarID")]
        public virtual Ejemplar? Ejemplar { get; set; }
    }
}
