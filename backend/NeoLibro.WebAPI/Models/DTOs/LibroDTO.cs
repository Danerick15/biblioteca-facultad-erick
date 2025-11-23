namespace NeoLibroAPI.Models.DTOs
{
    public class LibroDTO
    {
        public int LibroID { get; set; }
        public string ISBN { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string? Editorial { get; set; }
        public int? AnioPublicacion { get; set; }
        public string? Idioma { get; set; }
        public int? Paginas { get; set; }
        public string? LCCSeccion { get; set; }
        public string? LCCNumero { get; set; }
        public string? LCCCutter { get; set; }
        public string? SignaturaLCC { get; set; }
        
        // Información de disponibilidad
        public int TotalEjemplares { get; set; }
        public int EjemplaresDisponibles { get; set; }
        public int EjemplaresPrestados { get; set; }
        
        // Información de archivo digital (HU-10)
        public bool TieneArchivoDigital { get; set; }
        public string? TipoArchivoDigital { get; set; }
        public long? TamañoArchivoDigital { get; set; }
        public int ContadorVistas { get; set; }
        public int ContadorDescargas { get; set; }
        
        // Autores y categorías
        public List<string>? Autores { get; set; }
        public List<string>? Categorias { get; set; }
    }
}
