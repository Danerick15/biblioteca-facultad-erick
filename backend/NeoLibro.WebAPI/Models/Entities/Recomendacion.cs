using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Models.Entities
{
    public class Recomendacion
    {
        public int RecomendacionID { get; set; }
        public int ProfesorID { get; set; }
        public string Curso { get; set; } = string.Empty;
        public int? LibroID { get; set; }
        public string? URLExterna { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        
        // Propiedades de navegación
        public Usuario? Profesor { get; set; }
        public Libro? Libro { get; set; }
    }
}
