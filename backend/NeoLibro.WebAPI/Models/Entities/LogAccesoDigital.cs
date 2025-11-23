namespace NeoLibroAPI.Models.Entities
{
    public class LogAccesoDigital
    {
        public int LogID { get; set; }
        public int LibroID { get; set; }
        public int UsuarioID { get; set; }
        public string TipoAcceso { get; set; } = string.Empty; // "Vista" o "Descarga"
        public DateTime FechaAcceso { get; set; }
        public string? IPAcceso { get; set; }
        public string? UserAgent { get; set; }
        
        // Propiedades de navegación
        public Libro? Libro { get; set; }
        public Usuario? Usuario { get; set; }
    }
}

