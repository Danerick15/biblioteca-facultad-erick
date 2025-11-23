namespace NeoLibroAPI.Models.Requests
{
    public class CrearRecomendacionRequest
    {
        public string Curso { get; set; } = string.Empty;
        public int? LibroID { get; set; }
        public string? URLExterna { get; set; }
    }
}


