namespace NeoLibroAPI.Models.Requests
{
    public class UsuarioRegistroRequest
    {
        public string CodigoUniversitario { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string EmailInstitucional { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
        public string ConfirmarContrasena { get; set; } = string.Empty;
        public string Rol { get; set; } = "Estudiante";
    }
}