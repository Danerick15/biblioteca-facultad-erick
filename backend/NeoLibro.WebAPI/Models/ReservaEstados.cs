namespace NeoLibroAPI.Models
{
    /// <summary>
    /// Constantes de estados para la entidad Reserva.
    /// Usar siempre estas constantes al comparar o asignar estados.
    /// </summary>
    public static class ReservaEstados
    {
        public const string ColaEspera = "ColaEspera"; // En la cola esperando un ejemplar
        public const string PorAprobar = "PorAprobar"; // Requiere acción del personal
        public const string Aprobada = "Aprobada";     // Aprobada / ListaParaRetiro
        public const string Completada = "Completada"; // Reserva completada (entregada)
        public const string Cancelada = "Cancelada";   // Cancelada por usuario o admin
        public const string Expirada = "Expirada";     // No retirada en el plazo
        public const string Notificada = "Notificada"; // Se notificó al usuario

        public static readonly string[] All = new[] { ColaEspera, PorAprobar, Aprobada, Completada, Cancelada, Expirada, Notificada };
    }
}
