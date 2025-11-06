using NeoLibroAPI.Models.Entities;

namespace NeoLibroAPI.Models.Entities
{
    public class LibroCategoria
    {
        public int LibroID { get; set; }
        public int CategoriaID { get; set; }
        public bool EsCategoriaPrincipal { get; set; } = false;
        
        // Propiedades de navegación
        public Libro? Libro { get; set; }
        public Categoria? Categoria { get; set; }
    }
}
