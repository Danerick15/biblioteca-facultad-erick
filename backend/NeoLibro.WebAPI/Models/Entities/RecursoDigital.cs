using System.ComponentModel.DataAnnotations;

namespace NeoLibroAPI.Models.Entities
{
    public class RecursoDigital
    {
        [Key]
        public int RecursoID { get; set; }
        public int LibroID { get; set; }
        public string URL { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Gratuito";
        public string? Plataforma { get; set; }
        public string? Licencia { get; set; }
        public string? Proveedor { get; set; }
        public string? DRM { get; set; }
        
        // Propiedades de navegación
        public Libro? Libro { get; set; }
    }
}
