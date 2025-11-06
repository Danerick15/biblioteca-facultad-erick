namespace NeoLibroAPI.Models.DTOs
{
    public class PrestamoDTO
    {
        public int PrestamoID { get; set; }
        public int ReservaID { get; set; }
        public DateTime FechaPrestamo { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public DateTime? FechaDevolucion { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int Renovaciones { get; set; }
        public string? Observaciones { get; set; }
        
        // IDs de relaciones
        public int UsuarioID { get; set; }
        public int LibroID { get; set; }
        public int? EjemplarID { get; set; }
        
        // Información del usuario
        public string UsuarioNombre { get; set; } = string.Empty;
        public string UsuarioCodigo { get; set; } = string.Empty;
        
        // Información del libro
        public string LibroTitulo { get; set; } = string.Empty;
        public string LibroISBN { get; set; } = string.Empty;
        public int NumeroEjemplar { get; set; }
        public string CodigoBarras { get; set; } = string.Empty;
        
        // Estado calculado
        public string EstadoCalculado { get; set; } = string.Empty;
        public int? DiasAtraso { get; set; }
    }
}
