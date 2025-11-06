namespace NeoLibroAPI.Models.DTOs
{
    public class ResumenMultasDTO
    {
        public int TotalMultas { get; set; }
        public int MultasPendientes { get; set; }
        public int MultasPagadas { get; set; }
        public decimal MontoTotalPendiente { get; set; }
        public decimal MontoTotalPagado { get; set; }
        public decimal MontoTotalGeneral { get; set; }
    }
}
