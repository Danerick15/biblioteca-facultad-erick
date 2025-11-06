namespace NeoLibroAPI.Models.Entities
{
    public class Prestamo
    {
        public int PrestamoID { get; set; }
        public int EjemplarID { get; set; }
        public int UsuarioID { get; set; }
        public DateTime FechaPrestamo { get; set; } = DateTime.Now;
        public DateTime FechaVencimiento { get; set; }
        public DateTime? FechaDevolucion { get; set; }
        public string Estado { get; set; } = "Prestado";
        public int Renovaciones { get; set; } = 0;
        public string? Observaciones { get; set; }
        
        // Propiedades de navegación
        public Ejemplar? Ejemplar { get; set; }
        public Usuario? Usuario { get; set; }
        public List<Multa>? Multas { get; set; }
    }
}
