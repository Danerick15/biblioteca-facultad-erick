namespace NeoLibroAPI.Models.DTOs
{
    public class EstadisticasUsuarioDTO
    {
        public int TotalPrestamos { get; set; }
        public int PrestamosActivos { get; set; }
        public int PrestamosCompletados { get; set; }
        public int TotalMultas { get; set; }
        public int MultasPendientes { get; set; }
        public decimal MontoMultasPendientes { get; set; }
    }
}
