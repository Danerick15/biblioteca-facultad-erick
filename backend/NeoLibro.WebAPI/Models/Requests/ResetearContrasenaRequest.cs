namespace NeoLibroAPI.Models.Requests
{
    public class ResetearContrasenaRequest
    {
        public string EmailInstitucional { get; set; } = string.Empty;
        public string TokenRecuperacion { get; set; } = string.Empty;
        public string NuevaContrasena { get; set; } = string.Empty;
        public string ConfirmarContrasena { get; set; } = string.Empty;
    }
}
