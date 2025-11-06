namespace NeoLibroAPI.Models.Requests
{
    public class LoginRequest
    {
        public string EmailInstitucional { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }
}
