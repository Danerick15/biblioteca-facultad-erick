namespace NeoLibroAPI.Models.Entities
{
    public class Libro
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
        public string? SignaturaLCC { get; set; } // Campo calculado
        
        // Campos para archivo digital (HU-10)
        public string? RutaArchivoDigital { get; set; }
        public string? TipoArchivoDigital { get; set; } // PDF, EPUB, etc.
        public long? TamañoArchivoDigital { get; set; } // En bytes
        public DateTime? FechaSubidaDigital { get; set; }
        public int ContadorVistas { get; set; } = 0;
        public int ContadorDescargas { get; set; } = 0;
        
        // Propiedades de navegación para relaciones N:M
        public List<Autor>? Autores { get; set; }
        public List<Categoria>? Categorias { get; set; }
        public List<Ejemplar>? Ejemplares { get; set; }
        public List<RecursoDigital>? RecursosDigitales { get; set; }
    }
}
