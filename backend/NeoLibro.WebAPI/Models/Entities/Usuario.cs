namespace NeoLibroAPI.Models.Entities
{
    public class Usuario
    {
        public int UsuarioID { get; set; }
        public string CodigoUniversitario { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string EmailInstitucional { get; set; } = string.Empty;
        public string ContrasenaHash { get; set; } = string.Empty;
        public string Rol { get; set; } = "Estudiante";
        public bool Estado { get; set; } = true;
        public DateTime FechaRegistro { get; set; } = DateTime.Now;
        public DateTime FechaUltimaActualizacionContrasena { get; set; } = DateTime.Now;
    }
}