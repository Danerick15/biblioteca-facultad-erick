namespace NeoLibroAPI.Models.Requests
{
    public class ModificarRecomendacionRequest
    {
        public string Curso { get; set; } = string.Empty;
        public int? LibroID { get; set; }
        public string? URLExterna { get; set; }
    }
}


