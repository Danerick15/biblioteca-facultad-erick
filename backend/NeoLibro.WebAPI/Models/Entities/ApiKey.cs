namespace NeoLibroAPI.Models.Entities
{
    public class ApiKey
    {
        public int ApiKeyID { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activa { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public DateTime? FechaUltimoUso { get; set; }
        public int ContadorUso { get; set; } = 0;
        public int? LimiteUsoDiario { get; set; }
        public int? CreadoPor { get; set; }
    }
}


