namespace NeoLibroAPI.Models.Entities
{
    public class Autor
    {
        public int AutorID { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Biografia { get; set; }
        public string? ORCID { get; set; }
        
        // Propiedades de navegación
        public List<Libro>? Libros { get; set; }
    }
}
