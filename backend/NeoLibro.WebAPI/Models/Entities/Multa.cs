namespace NeoLibroAPI.Models.Entities
{
    public class Multa
    {
        public int MultaID { get; set; }
        public int PrestamoID { get; set; }
        public int UsuarioID { get; set; }
        public decimal Monto { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public int? DiasAtraso { get; set; }
        public string? Motivo { get; set; }
        public DateTime? FechaCobro { get; set; }
        
        // Propiedades de navegación
        public Prestamo? Prestamo { get; set; }
        public Usuario? Usuario { get; set; }
    }
}
