namespace NeoLibroAPI.Models.DTOs
{
    public class RecomendacionDTO
    {
        public int RecomendacionID { get; set; }
        public int ProfesorID { get; set; }
        public string NombreProfesor { get; set; } = string.Empty;
        public string Curso { get; set; } = string.Empty;
        public int? LibroID { get; set; }
        public string? TituloLibro { get; set; }
        public string? ISBN { get; set; }
        public string? URLExterna { get; set; }
        public DateTime Fecha { get; set; }
        
        // Información del libro si está disponible
        public LibroDTO? Libro { get; set; }
    }
}


