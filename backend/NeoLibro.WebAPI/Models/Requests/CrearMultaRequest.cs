namespace NeoLibroAPI.Models.Requests
{
    public class CrearMultaRequest
    {
        public int PrestamoID { get; set; }
        public int UsuarioID { get; set; }
        public decimal Monto { get; set; }
        public string? Motivo { get; set; }
        public int? DiasAtraso { get; set; }
    }
}
