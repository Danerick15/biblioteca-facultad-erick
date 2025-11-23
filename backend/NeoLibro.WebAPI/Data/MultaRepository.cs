using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Multas
    /// Maneja todas las operaciones de acceso a datos para multas
    /// </summary>
    public class MultaRepository : IMultaRepository
    {
        private readonly string _cadenaConexion;

        public MultaRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<Multa> ListarMultasPorUsuario(int usuarioId)
        {
            var lista = new List<Multa>();

            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    SELECT MultaID, PrestamoID, UsuarioID, Monto, Estado, 
                           DiasAtraso, Motivo, FechaCobro
                    FROM Multas 
                    WHERE UsuarioID = @UsuarioID
                    ORDER BY MultaID DESC", conexion);
                comando.Parameters.AddWithValue("@UsuarioID", usuarioId);

                using (var reader = comando.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Multa
                        {
                            MultaID = Convert.ToInt32(reader["MultaID"]),
                            PrestamoID = Convert.ToInt32(reader["PrestamoID"]),
                            UsuarioID = Convert.ToInt32(reader["UsuarioID"]),
                            Monto = Convert.ToDecimal(reader["Monto"]),
                            Estado = reader["Estado"].ToString() ?? "Pendiente",
                            DiasAtraso = reader["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(reader["DiasAtraso"]) : null,
                            Motivo = reader["Motivo"]?.ToString(),
                            FechaCobro = reader["FechaCobro"] != DBNull.Value ? Convert.ToDateTime(reader["FechaCobro"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public List<Multa> ListarMultasPendientes()
        {
            var lista = new List<Multa>();

            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    SELECT MultaID, PrestamoID, UsuarioID, Monto, Estado, 
                           DiasAtraso, Motivo, FechaCobro
                    FROM Multas 
                    WHERE Estado = 'Pendiente'
                    ORDER BY MultaID DESC", conexion);

                using (var reader = comando.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Multa
                        {
                            MultaID = Convert.ToInt32(reader["MultaID"]),
                            PrestamoID = Convert.ToInt32(reader["PrestamoID"]),
                            UsuarioID = Convert.ToInt32(reader["UsuarioID"]),
                            Monto = Convert.ToDecimal(reader["Monto"]),
                            Estado = reader["Estado"].ToString() ?? "Pendiente",
                            DiasAtraso = reader["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(reader["DiasAtraso"]) : null,
                            Motivo = reader["Motivo"]?.ToString(),
                            FechaCobro = reader["FechaCobro"] != DBNull.Value ? Convert.ToDateTime(reader["FechaCobro"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public List<Multa> ListarMultasPendientesPorUsuario(int usuarioId)
        {
            var lista = new List<Multa>();

            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    SELECT MultaID, PrestamoID, UsuarioID, Monto, Estado, 
                           DiasAtraso, Motivo, FechaCobro
                    FROM Multas 
                    WHERE UsuarioID = @UsuarioID AND Estado = 'Pendiente'
                    ORDER BY MultaID DESC", conexion);
                comando.Parameters.AddWithValue("@UsuarioID", usuarioId);

                using (var reader = comando.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new Multa
                        {
                            MultaID = Convert.ToInt32(reader["MultaID"]),
                            PrestamoID = Convert.ToInt32(reader["PrestamoID"]),
                            UsuarioID = Convert.ToInt32(reader["UsuarioID"]),
                            Monto = Convert.ToDecimal(reader["Monto"]),
                            Estado = reader["Estado"].ToString() ?? "Pendiente",
                            DiasAtraso = reader["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(reader["DiasAtraso"]) : null,
                            Motivo = reader["Motivo"]?.ToString(),
                            FechaCobro = reader["FechaCobro"] != DBNull.Value ? Convert.ToDateTime(reader["FechaCobro"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public ResumenMultasDTO ObtenerResumenMultasUsuario(int usuarioId)
        {
            try
            {
                using (var conexion = GetConnection())
                {
                    conexion.Open();
                    var comando = new SqlCommand(@"
                        SELECT 
                            COUNT(*) as TotalMultas,
                            SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as MultasPendientes,
                            SUM(CASE WHEN Estado = 'Pagada' THEN 1 ELSE 0 END) as MultasPagadas,
                            ISNULL(SUM(CASE WHEN Estado = 'Pendiente' THEN Monto ELSE 0 END), 0) as MontoTotalPendiente,
                            ISNULL(SUM(CASE WHEN Estado = 'Pagada' THEN Monto ELSE 0 END), 0) as MontoTotalPagado,
                            ISNULL(SUM(Monto), 0) as MontoTotalGeneral
                        FROM Multas 
                        WHERE UsuarioID = @UsuarioID", conexion);
                    comando.Parameters.AddWithValue("@UsuarioID", usuarioId);

                    using (var reader = comando.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            // Usar comprobaciones de DBNull para evitar InvalidCastException
                            int totalMultas = reader["TotalMultas"] != DBNull.Value ? Convert.ToInt32(reader["TotalMultas"]) : 0;
                            int multasPendientes = reader["MultasPendientes"] != DBNull.Value ? Convert.ToInt32(reader["MultasPendientes"]) : 0;
                            int multasPagadas = reader["MultasPagadas"] != DBNull.Value ? Convert.ToInt32(reader["MultasPagadas"]) : 0;
                            decimal montoPendiente = reader["MontoTotalPendiente"] != DBNull.Value ? Convert.ToDecimal(reader["MontoTotalPendiente"]) : 0m;
                            decimal montoPagado = reader["MontoTotalPagado"] != DBNull.Value ? Convert.ToDecimal(reader["MontoTotalPagado"]) : 0m;
                            decimal montoGeneral = reader["MontoTotalGeneral"] != DBNull.Value ? Convert.ToDecimal(reader["MontoTotalGeneral"]) : 0m;

                            return new ResumenMultasDTO
                            {
                                TotalMultas = totalMultas,
                                MultasPendientes = multasPendientes,
                                MultasPagadas = multasPagadas,
                                MontoTotalPendiente = montoPendiente,
                                MontoTotalPagado = montoPagado,
                                MontoTotalGeneral = montoGeneral
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en ObtenerResumenMultasUsuario: {ex.Message}");
                // En caso de error, devolver un resumen vacío pero válido
            }

            // Siempre devolver un objeto válido, incluso si no hay multas
            return new ResumenMultasDTO
            {
                TotalMultas = 0,
                MultasPendientes = 0,
                MultasPagadas = 0,
                MontoTotalPendiente = 0,
                MontoTotalPagado = 0,
                MontoTotalGeneral = 0
            };
        }

        public bool Crear(Multa multa)
        {
            using (var conexion = GetConnection())
            {
                conexion.Open();
                using (var transaction = conexion.BeginTransaction())
                {
                    try
                    {
                        // Insertar la multa
                        var comando = new SqlCommand(@"
                            INSERT INTO Multas (PrestamoID, UsuarioID, Monto, Estado, Motivo, DiasAtraso)
                            VALUES (@PrestamoID, @UsuarioID, @Monto, @Estado, @Motivo, @DiasAtraso);
                            SELECT CAST(SCOPE_IDENTITY() AS INT);", conexion, transaction);
                        comando.Parameters.AddWithValue("@PrestamoID", multa.PrestamoID);
                        comando.Parameters.AddWithValue("@UsuarioID", multa.UsuarioID);
                        comando.Parameters.AddWithValue("@Monto", multa.Monto);
                        comando.Parameters.AddWithValue("@Estado", multa.Estado);
                        comando.Parameters.AddWithValue("@Motivo", multa.Motivo ?? (object)DBNull.Value);
                        comando.Parameters.AddWithValue("@DiasAtraso", multa.DiasAtraso ?? (object)DBNull.Value);

                        var multaId = (int)comando.ExecuteScalar();

                        // Obtener información del préstamo y libro para la notificación
                        string? tituloLibro = null;
                        using (var cmdLibro = new SqlCommand(@"
                            SELECT TOP 1 l.Titulo
                            FROM Prestamos p
                            INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
                            LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID
                            LEFT JOIN Libros l ON l.LibroID = ISNULL(e.LibroID, r.LibroID)
                            WHERE p.PrestamoID = @PrestamoID", conexion, transaction))
                        {
                            cmdLibro.Parameters.AddWithValue("@PrestamoID", multa.PrestamoID);
                            var resultado = cmdLibro.ExecuteScalar();
                            if (resultado != null && resultado != DBNull.Value)
                                tituloLibro = resultado.ToString();
                        }

                        // Crear notificación para el estudiante
                        var mensajeMulta = $"Se te ha generado una multa de ${multa.Monto:F2}";
                        if (!string.IsNullOrEmpty(multa.Motivo))
                            mensajeMulta += $" por: {multa.Motivo}";
                        if (multa.DiasAtraso.HasValue)
                            mensajeMulta += $" ({multa.DiasAtraso.Value} día(s) de atraso)";
                        if (!string.IsNullOrEmpty(tituloLibro))
                            mensajeMulta += $" - Libro: {tituloLibro}";

                        // Obtener ReservaID del préstamo (todos los préstamos tienen ReservaID según el esquema)
                        int reservaId = 0;
                        using (var cmdReserva = new SqlCommand(@"
                            SELECT TOP 1 ReservaID
                            FROM Prestamos
                            WHERE PrestamoID = @PrestamoID", conexion, transaction))
                        {
                            cmdReserva.Parameters.AddWithValue("@PrestamoID", multa.PrestamoID);
                            var resultado = cmdReserva.ExecuteScalar();
                            if (resultado != null && resultado != DBNull.Value)
                                reservaId = Convert.ToInt32(resultado);
                        }

                        // Solo crear notificación si encontramos un ReservaID válido
                        // (todos los préstamos deberían tener uno, pero por seguridad verificamos)
                        if (reservaId > 0)
                        {
                            using (var cmdNotif = new SqlCommand(@"
                                INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                                VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", conexion, transaction))
                            {
                                cmdNotif.Parameters.AddWithValue("@ReservaID", reservaId);
                                cmdNotif.Parameters.AddWithValue("@UsuarioID", multa.UsuarioID);
                                cmdNotif.Parameters.AddWithValue("@Tipo", "MultaGenerada");
                                cmdNotif.Parameters.AddWithValue("@Mensaje", mensajeMulta);
                                cmdNotif.ExecuteNonQuery();
                            }
                        }
                        else
                        {
                            // Si no hay ReservaID, loguear pero no fallar la creación de la multa
                            #if DEBUG
                            Console.WriteLine($"[MultaRepository.Crear] No se encontró ReservaID para PrestamoID {multa.PrestamoID}, omitiendo notificación");
                            #endif
                        }

                        transaction.Commit();
                        return true;
                    }
                    catch
                    {
                        transaction.Rollback();
                        return false;
                    }
                }
            }
        }

        public bool PagarMulta(int multaId, string? observaciones = null)
        {
            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    UPDATE Multas 
                    SET Estado = 'Pagada', FechaCobro = GETDATE()
                    WHERE MultaID = @MultaID", conexion);
                comando.Parameters.AddWithValue("@MultaID", multaId);

                var resultado = comando.ExecuteNonQuery();
                return resultado > 0;
            }
        }

        public Multa? ObtenerPorId(int multaId)
        {
            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    SELECT MultaID, PrestamoID, UsuarioID, Monto, Estado, 
                           DiasAtraso, Motivo, FechaCobro
                    FROM Multas 
                    WHERE MultaID = @MultaID", conexion);
                comando.Parameters.AddWithValue("@MultaID", multaId);

                using (var reader = comando.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new Multa
                        {
                            MultaID = Convert.ToInt32(reader["MultaID"]),
                            PrestamoID = Convert.ToInt32(reader["PrestamoID"]),
                            UsuarioID = Convert.ToInt32(reader["UsuarioID"]),
                            Monto = Convert.ToDecimal(reader["Monto"]),
                            Estado = reader["Estado"].ToString() ?? "Pendiente",
                            DiasAtraso = reader["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(reader["DiasAtraso"]) : null,
                            Motivo = reader["Motivo"]?.ToString(),
                            FechaCobro = reader["FechaCobro"] != DBNull.Value ? Convert.ToDateTime(reader["FechaCobro"]) : null
                        };
                    }
                }
            }

            return null;
        }

        public bool TieneMultasPendientes(int usuarioId)
        {
            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    SELECT 1 FROM Multas 
                    WHERE UsuarioID = @UsuarioID AND Estado = 'Pendiente'", conexion);
                comando.Parameters.AddWithValue("@UsuarioID", usuarioId);

                return comando.ExecuteScalar() != null;
            }
        }

        public int CorregirMultasPrestamosDevueltos()
        {
            using (var conexion = GetConnection())
            {
                conexion.Open();
                var comando = new SqlCommand(@"
                    UPDATE Multas 
                    SET Estado = 'Pagada', FechaCobro = GETDATE()
                    WHERE Estado = 'Pendiente'
                    AND PrestamoID IN (
                        SELECT PrestamoID 
                        FROM Prestamos 
                        WHERE Estado = 'Devuelto'
                    )", conexion);

                var multasActualizadas = comando.ExecuteNonQuery();
                return multasActualizadas;
            }
        }
    }
}
