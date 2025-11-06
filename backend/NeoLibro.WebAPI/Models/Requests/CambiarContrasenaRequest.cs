namespace NeoLibroAPI.Models.Requests
{
    public class CambiarContrasenaRequest
    {
        public string ContrasenaActual { get; set; } = string.Empty;
        public string NuevaContrasena { get; set; } = string.Empty;
        public string ConfirmarContrasena { get; set; } = string.Empty;
    }
}
