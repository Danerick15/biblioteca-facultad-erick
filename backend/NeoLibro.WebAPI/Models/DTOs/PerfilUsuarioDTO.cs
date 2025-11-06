namespace NeoLibroAPI.Models.DTOs
{
    public class PerfilUsuarioDTO
    {
        public int UsuarioID { get; set; }
        public string CodigoUniversitario { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string EmailInstitucional { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public bool Estado { get; set; }
        public DateTime FechaRegistro { get; set; }
        public DateTime FechaUltimaActualizacionContrasena { get; set; }
        
        // Estadísticas del usuario
        public int TotalPrestamos { get; set; }
        public int PrestamosActivos { get; set; }
        public int PrestamosCompletados { get; set; }
        public int TotalMultas { get; set; }
        public int MultasPendientes { get; set; }
        public decimal MontoMultasPendientes { get; set; }
    }

}
