namespace NeoLibroAPI.Models.Entities
{
    public class Ejemplar
    {
        public int EjemplarID { get; set; }
        public int LibroID { get; set; }
        public int NumeroEjemplar { get; set; }
        public string CodigoBarras { get; set; } = string.Empty;
        public string? Ubicacion { get; set; }
        public string Estado { get; set; } = "Disponible";
        public DateTime FechaAlta { get; set; } = DateTime.Now;
        public string? Observaciones { get; set; }
        
        // Propiedades de navegación
        public Libro? Libro { get; set; }
        public List<Prestamo>? Prestamos { get; set; }
    }
}
