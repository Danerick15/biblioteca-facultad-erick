namespace NeoLibroAPI.Models.Requests
{
    public class CrearPrestamoRequest
    {
        public int EjemplarID { get; set; }
        public int UsuarioID { get; set; }
        public int DiasPrestamo { get; set; } = 15;
    }
}
