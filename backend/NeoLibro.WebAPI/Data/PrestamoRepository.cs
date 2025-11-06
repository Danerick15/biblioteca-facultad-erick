using System;
using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    public class PrestamoRepository : IPrestamoRepository
    {
        private readonly string _cadenaConexion;
        private readonly IEjemplarRepository _ejemplarRepository;

        public PrestamoRepository(string cadenaConexion, IEjemplarRepository ejemplarRepository)
        {
            _cadenaConexion = cadenaConexion;
            _ejemplarRepository = ejemplarRepository;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<PrestamoDTO> ListarPrestamosActivos()
        {
            var lista = new List<PrestamoDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        p.PrestamoID, p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion,
                        p.Estado, p.Renovaciones, p.Observaciones, r.ReservaID,
                        r.UsuarioID, r.LibroID, r.EjemplarID,
                        u.Nombre as UsuarioNombre, u.CodigoUniversitario as UsuarioCodigo,
                        l.Titulo as LibroTitulo, l.ISBN as LibroISBN,
                        e.NumeroEjemplar, e.CodigoBarras,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' THEN 'Atrasado'
                            ELSE p.Estado
                        END as EstadoCalculado,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' 
                            THEN DATEDIFF(day, p.FechaVencimiento, GETDATE())
                            ELSE NULL
                        END as DiasAtraso
                    FROM Prestamos p
                    INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
                    INNER JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
                    INNER JOIN Libros l ON r.LibroID = l.LibroID
                    LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID
                    WHERE p.Estado = 'Prestado'
                    ORDER BY p.FechaVencimiento", cn);

                cn.Open();
                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new PrestamoDTO
                        {
                            PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                            ReservaID = Convert.ToInt32(dr["ReservaID"]),
                            FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                            FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                            FechaDevolucion = dr["FechaDevolucion"] != DBNull.Value ? Convert.ToDateTime(dr["FechaDevolucion"]) : null,
                            Estado = dr["Estado"].ToString() ?? "",
                            Renovaciones = Convert.ToInt32(dr["Renovaciones"]),
                            Observaciones = dr["Observaciones"]?.ToString(),
                            UsuarioID = Convert.ToInt32(dr["UsuarioID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            EjemplarID = dr["EjemplarID"] != DBNull.Value ? Convert.ToInt32(dr["EjemplarID"]) : null,
                            UsuarioNombre = dr["UsuarioNombre"].ToString() ?? "",
                            UsuarioCodigo = dr["UsuarioCodigo"].ToString() ?? "",
                            LibroTitulo = dr["LibroTitulo"].ToString() ?? "",
                            LibroISBN = dr["LibroISBN"].ToString() ?? "",
                            NumeroEjemplar = dr["NumeroEjemplar"] != DBNull.Value ? Convert.ToInt32(dr["NumeroEjemplar"]) : 0,
                            CodigoBarras = dr["CodigoBarras"]?.ToString() ?? "",
                            EstadoCalculado = dr["EstadoCalculado"].ToString() ?? "",
                            DiasAtraso = dr["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(dr["DiasAtraso"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public List<PrestamoDTO> ListarPrestamosPorUsuario(int usuarioId)
        {
            var lista = new List<PrestamoDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        p.PrestamoID, p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion,
                        p.Estado, p.Renovaciones, p.Observaciones, r.ReservaID,
                        r.UsuarioID, r.LibroID, r.EjemplarID,
                        u.Nombre as UsuarioNombre, u.CodigoUniversitario as UsuarioCodigo,
                        l.Titulo as LibroTitulo, l.ISBN as LibroISBN,
                        e.NumeroEjemplar, e.CodigoBarras,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' THEN 'Atrasado'
                            ELSE p.Estado
                        END as EstadoCalculado,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' 
                            THEN DATEDIFF(day, p.FechaVencimiento, GETDATE())
                            ELSE NULL
                        END as DiasAtraso
                    FROM Prestamos p
                    INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
                    INNER JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
                    INNER JOIN Libros l ON r.LibroID = l.LibroID
                    LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID
                    WHERE r.UsuarioID = @UsuarioID
                    ORDER BY p.FechaPrestamo DESC", cn);

                cmd.Parameters.AddWithValue("@UsuarioID", usuarioId);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new PrestamoDTO
                        {
                            PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                            ReservaID = Convert.ToInt32(dr["ReservaID"]),
                            FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                            FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                            FechaDevolucion = dr["FechaDevolucion"] != DBNull.Value ? Convert.ToDateTime(dr["FechaDevolucion"]) : null,
                            Estado = dr["Estado"].ToString() ?? "",
                            Renovaciones = Convert.ToInt32(dr["Renovaciones"]),
                            Observaciones = dr["Observaciones"]?.ToString(),
                            UsuarioID = Convert.ToInt32(dr["UsuarioID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            EjemplarID = dr["EjemplarID"] != DBNull.Value ? Convert.ToInt32(dr["EjemplarID"]) : null,
                            UsuarioNombre = dr["UsuarioNombre"].ToString() ?? "",
                            UsuarioCodigo = dr["UsuarioCodigo"].ToString() ?? "",
                            LibroTitulo = dr["LibroTitulo"].ToString() ?? "",
                            LibroISBN = dr["LibroISBN"].ToString() ?? "",
                            NumeroEjemplar = dr["NumeroEjemplar"] != DBNull.Value ? Convert.ToInt32(dr["NumeroEjemplar"]) : 0,
                            CodigoBarras = dr["CodigoBarras"]?.ToString() ?? "",
                            EstadoCalculado = dr["EstadoCalculado"].ToString() ?? "",
                            DiasAtraso = dr["DiasAtraso"] != DBNull.Value ? Convert.ToInt32(dr["DiasAtraso"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public List<PrestamoDTO> ListarPrestamosAtrasados()
        {
            var lista = new List<PrestamoDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        p.PrestamoID, p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion,
                        p.Estado, p.Renovaciones, p.Observaciones,
                        u.Nombre as UsuarioNombre, u.CodigoUniversitario as UsuarioCodigo,
                        l.Titulo as LibroTitulo, l.ISBN as LibroISBN,
                        e.NumeroEjemplar, e.CodigoBarras,
                        'Atrasado' as EstadoCalculado,
                        DATEDIFF(day, p.FechaVencimiento, GETDATE()) as DiasAtraso
                    FROM Prestamos p
                    INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
                    INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
                    INNER JOIN Libros l ON e.LibroID = l.LibroID
                    WHERE p.Estado = 'Prestado' AND p.FechaVencimiento < GETDATE()
                    ORDER BY p.FechaVencimiento", cn);

                cn.Open();
                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new PrestamoDTO
                        {
                            PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                            FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                            FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                            FechaDevolucion = dr["FechaDevolucion"] != DBNull.Value ? Convert.ToDateTime(dr["FechaDevolucion"]) : null,
                            Estado = dr["Estado"].ToString() ?? "",
                            Renovaciones = Convert.ToInt32(dr["Renovaciones"]),
                            Observaciones = dr["Observaciones"]?.ToString(),
                            UsuarioNombre = dr["UsuarioNombre"].ToString() ?? "",
                            UsuarioCodigo = dr["UsuarioCodigo"].ToString() ?? "",
                            LibroTitulo = dr["LibroTitulo"].ToString() ?? "",
                            LibroISBN = dr["LibroISBN"].ToString() ?? "",
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            EstadoCalculado = dr["EstadoCalculado"].ToString() ?? "",
                            DiasAtraso = Convert.ToInt32(dr["DiasAtraso"])
                        });
                    }
                }
            }

            return lista;
        }

        public List<PrestamoDTO> ObtenerHistorialCompletoUsuario(int usuarioId)
        {
            var lista = new List<PrestamoDTO>();

            try
            {
                using (var cn = GetConnection())
                {
                    var cmd = new SqlCommand(@"
                        SELECT 
                            p.PrestamoID, p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion,
                            p.Estado, p.Renovaciones, p.Observaciones,
                            u.Nombre as UsuarioNombre, u.CodigoUniversitario as UsuarioCodigo,
                            l.Titulo as LibroTitulo, l.ISBN as LibroISBN,
                            e.NumeroEjemplar, e.CodigoBarras,
                            CASE 
                                WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' THEN 'Atrasado'
                                ELSE p.Estado
                            END as EstadoCalculado,
                            CASE 
                                WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' 
                                THEN DATEDIFF(day, p.FechaVencimiento, GETDATE())
                                ELSE NULL
                            END as DiasAtraso
                        FROM Prestamos p
                        INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
                        INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
                        INNER JOIN Libros l ON e.LibroID = l.LibroID
                        WHERE p.UsuarioID = @UsuarioID
                        ORDER BY p.FechaPrestamo DESC", cn);

                    cmd.Parameters.AddWithValue("@UsuarioID", usuarioId);

                    cn.Open();
                    using (var dr = cmd.ExecuteReader())
                    {
                        while (dr.Read())
                        {
                            lista.Add(new PrestamoDTO
                            {
                                PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                                FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                                FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                                FechaDevolucion = dr["FechaDevolucion"] == DBNull.Value ? null : Convert.ToDateTime(dr["FechaDevolucion"]),
                                Estado = dr["Estado"].ToString() ?? "",
                                Renovaciones = Convert.ToInt32(dr["Renovaciones"]),
                                Observaciones = dr["Observaciones"]?.ToString(),
                                UsuarioNombre = dr["UsuarioNombre"].ToString() ?? "",
                                UsuarioCodigo = dr["UsuarioCodigo"].ToString() ?? "",
                                LibroTitulo = dr["LibroTitulo"].ToString() ?? "",
                                LibroISBN = dr["LibroISBN"].ToString() ?? "",
                                NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                                CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                                EstadoCalculado = dr["EstadoCalculado"].ToString() ?? "",
                                DiasAtraso = dr["DiasAtraso"] == DBNull.Value ? null : Convert.ToInt32(dr["DiasAtraso"])
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en ObtenerHistorialCompletoUsuario: {ex.Message}");
                // En caso de error, devolver lista vacía
            }

            return lista;
        }

        public List<PrestamoDTO> ListarPrestamosActivosPorUsuario(int usuarioId)
        {
            var lista = new List<PrestamoDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        p.PrestamoID, p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion,
                        p.Estado, p.Renovaciones, p.Observaciones,
                        u.Nombre as UsuarioNombre, u.CodigoUniversitario as UsuarioCodigo,
                        l.Titulo as LibroTitulo, l.ISBN as LibroISBN,
                        e.NumeroEjemplar, e.CodigoBarras,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' THEN 'Atrasado'
                            ELSE p.Estado
                        END as EstadoCalculado,
                        CASE 
                            WHEN p.FechaVencimiento < GETDATE() AND p.Estado = 'Prestado' 
                            THEN DATEDIFF(day, p.FechaVencimiento, GETDATE())
                            ELSE NULL
                        END as DiasAtraso
                    FROM Prestamos p
                    INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
                    INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
                    INNER JOIN Libros l ON e.LibroID = l.LibroID
                    WHERE p.UsuarioID = @UsuarioID AND p.Estado = 'Prestado'
                    ORDER BY p.FechaVencimiento", cn);

                cmd.Parameters.AddWithValue("@UsuarioID", usuarioId);

                cn.Open();
                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new PrestamoDTO
                        {
                            PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                            FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                            FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                            FechaDevolucion = dr["FechaDevolucion"] == DBNull.Value ? null : Convert.ToDateTime(dr["FechaDevolucion"]),
                            Estado = dr["Estado"].ToString() ?? "",
                            Renovaciones = Convert.ToInt32(dr["Renovaciones"]),
                            Observaciones = dr["Observaciones"]?.ToString(),
                            UsuarioNombre = dr["UsuarioNombre"].ToString() ?? "",
                            UsuarioCodigo = dr["UsuarioCodigo"].ToString() ?? "",
                            LibroTitulo = dr["LibroTitulo"].ToString() ?? "",
                            LibroISBN = dr["LibroISBN"].ToString() ?? "",
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            EstadoCalculado = dr["EstadoCalculado"].ToString() ?? "",
                            DiasAtraso = dr["DiasAtraso"] == DBNull.Value ? null : Convert.ToInt32(dr["DiasAtraso"])
                        });
                    }
                }
            }

            return lista;
        }

        public bool CrearPrestamo(int ejemplarId, int usuarioId, int diasPrestamo = 15)
        {
            using (var cn = GetConnection())
            {
                cn.Open();
                using (var transaction = cn.BeginTransaction())
                {
                    try
                    {
                        // Verificar que el ejemplar esté disponible
                        var ejemplar = _ejemplarRepository.ObtenerPorId(ejemplarId);
                        if (ejemplar == null || ejemplar.Estado != "Disponible")
                            return false;

                        // Verificar que no tenga préstamos activos
                        var cmdVerificar = new SqlCommand(@"
                            SELECT 1 FROM Prestamos 
                            WHERE EjemplarID = @EjemplarID AND Estado = 'Prestado'", cn, transaction);
                        cmdVerificar.Parameters.AddWithValue("@EjemplarID", ejemplarId);
                        
                        if (cmdVerificar.ExecuteScalar() != null)
                            return false;

                        // Crear el préstamo
                        var cmdPrestamo = new SqlCommand(@"
                            INSERT INTO Prestamos (EjemplarID, UsuarioID, FechaPrestamo, FechaVencimiento, Estado)
                            VALUES (@EjemplarID, @UsuarioID, GETDATE(), DATEADD(day, @DiasPrestamo, GETDATE()), 'Prestado')", cn, transaction);
                        
                        cmdPrestamo.Parameters.AddWithValue("@EjemplarID", ejemplarId);
                        cmdPrestamo.Parameters.AddWithValue("@UsuarioID", usuarioId);
                        cmdPrestamo.Parameters.AddWithValue("@DiasPrestamo", diasPrestamo);
                        
                        cmdPrestamo.ExecuteNonQuery();

                        // Actualizar estado del ejemplar
                        var cmdEjemplar = new SqlCommand(@"
                            UPDATE Ejemplares 
                            SET Estado = 'Prestado' 
                            WHERE EjemplarID = @EjemplarID", cn, transaction);
                        
                        cmdEjemplar.Parameters.AddWithValue("@EjemplarID", ejemplarId);
                        cmdEjemplar.ExecuteNonQuery();

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

        public bool ProcesarDevolucion(int prestamoId, string? observaciones = null)
        {
            using (var cn = GetConnection())
            {
                cn.Open();
                using (var transaction = cn.BeginTransaction())
                {
                    try
                    {
                        // Obtener datos asociados al préstamo (EjemplarID y UsuarioID del préstamo)
                        // En el esquema actual Prestamos referencia a Reservas, por eso hacemos join
                        var cmdPrestamo = new SqlCommand(@"
                            SELECT r.EjemplarID, r.UsuarioID, p.ReservaID
                            FROM Prestamos p
                            INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
                            WHERE p.PrestamoID = @PrestamoID AND p.Estado = 'Prestado'", cn, transaction);
                        cmdPrestamo.Parameters.AddWithValue("@PrestamoID", prestamoId);

                        int? ejemplarId = null;
                        int? usuarioDevolucionId = null;
                        int? reservaIdDelPrestamo = null;

                        using (var dr = cmdPrestamo.ExecuteReader())
                        {
                            if (dr.Read())
                            {
                                ejemplarId = dr["EjemplarID"] != DBNull.Value ? (int?)Convert.ToInt32(dr["EjemplarID"]) : null;
                                usuarioDevolucionId = dr["UsuarioID"] != DBNull.Value ? (int?)Convert.ToInt32(dr["UsuarioID"]) : null;
                                reservaIdDelPrestamo = dr["ReservaID"] != DBNull.Value ? (int?)Convert.ToInt32(dr["ReservaID"]) : null;
                            }
                        }

                        if (!ejemplarId.HasValue)
                            return false;

                        // Actualizar préstamo
                        var cmdActualizarPrestamo = new SqlCommand(@"
                            UPDATE Prestamos 
                            SET Estado = 'Devuelto', FechaDevolucion = GETDATE(), Observaciones = @Observaciones
                            WHERE PrestamoID = @PrestamoID", cn, transaction);
                        
                        cmdActualizarPrestamo.Parameters.AddWithValue("@PrestamoID", prestamoId);
                        cmdActualizarPrestamo.Parameters.AddWithValue("@Observaciones", (object?)observaciones ?? DBNull.Value);
                        cmdActualizarPrestamo.ExecuteNonQuery();

                        // Obtener el LibroID del ejemplar devuelto
                        int? libroId = null;
                        var cmdLibro = new SqlCommand("SELECT LibroID FROM Ejemplares WHERE EjemplarID = @EjemplarID", cn, transaction);
                        cmdLibro.Parameters.AddWithValue("@EjemplarID", ejemplarId.Value);
                        var libroIdResult = cmdLibro.ExecuteScalar();
                        if (libroIdResult != null && libroIdResult != DBNull.Value)
                            libroId = Convert.ToInt32(libroIdResult);

                        // Poner ejemplar disponible primero
                        var cmdActualizarEjemplar = new SqlCommand(@"
                            UPDATE Ejemplares 
                            SET Estado = 'Disponible' 
                            WHERE EjemplarID = @EjemplarID", cn, transaction);
                        cmdActualizarEjemplar.Parameters.AddWithValue("@EjemplarID", ejemplarId.Value);
                        var rowsUpdated = cmdActualizarEjemplar.ExecuteNonQuery();
                        
                        #if DEBUG
                        Console.WriteLine($"[ProcesarDevolucion] Ejemplar {ejemplarId.Value} actualizado a 'Disponible'. Filas afectadas: {rowsUpdated}");
                        #endif

                        // Procesar la cola de reservas para este libro si hay ejemplar disponible
                        if (libroId.HasValue)
                        {
                            // Buscar la primera reserva en cola para este libro
                            int? primeraReservaId = null;
                            int? usuarioReservaId = null;
                            string? tituloLibro = null;
                            
                            var cmdReserva = new SqlCommand(@"
                                SELECT TOP 1 r.ReservaID, r.UsuarioID, ISNULL(l.Titulo, 'Libro') as Titulo
                                FROM Reservas r
                                LEFT JOIN Libros l ON r.LibroID = l.LibroID
                                WHERE r.LibroID = @LibroID 
                                AND r.Estado = 'ColaEspera'
                                AND r.TipoReserva = 'ColaEspera'
                                ORDER BY 
                                    CASE WHEN r.PrioridadCola IS NULL THEN 999999 ELSE r.PrioridadCola END,
                                    r.FechaReserva", cn, transaction);
                            cmdReserva.Parameters.AddWithValue("@LibroID", libroId.Value);
                            
                            using (var reader = cmdReserva.ExecuteReader())
                            {
                                if (reader.Read())
                                {
                                    primeraReservaId = reader.GetInt32("ReservaID");
                                    usuarioReservaId = reader.GetInt32("UsuarioID");
                                    tituloLibro = reader.GetString("Titulo");
                                }
                            }

                            if (primeraReservaId.HasValue && usuarioReservaId.HasValue)
                            {
                                // Actualizar la reserva: asignar ejemplar y cambiar a Retiro/PorAprobar
                                var cmdUpdateReserva = new SqlCommand(@"
                                    UPDATE Reservas 
                                    SET EjemplarID = @EjemplarID,
                                        TipoReserva = 'Retiro',
                                        Estado = 'PorAprobar',
                                        FechaLimiteRetiro = DATEADD(day, 2, GETDATE()),
                                        PrioridadCola = NULL
                                    WHERE ReservaID = @ReservaID", cn, transaction);
                                cmdUpdateReserva.Parameters.AddWithValue("@EjemplarID", ejemplarId.Value);
                                cmdUpdateReserva.Parameters.AddWithValue("@ReservaID", primeraReservaId.Value);
                                cmdUpdateReserva.ExecuteNonQuery();

                                // Marcar el ejemplar como Reservado (no Disponible, porque está asignado a la reserva)
                                var cmdEjemplarReservado = new SqlCommand(@"
                                    UPDATE Ejemplares 
                                    SET Estado = 'Reservado'
                                    WHERE EjemplarID = @EjemplarID", cn, transaction);
                                cmdEjemplarReservado.Parameters.AddWithValue("@EjemplarID", ejemplarId.Value);
                                cmdEjemplarReservado.ExecuteNonQuery();

                                // Crear notificación para el estudiante
                                var cmdNotif = new SqlCommand(@"
                                    INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                                    VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", cn, transaction);
                                cmdNotif.Parameters.AddWithValue("@ReservaID", primeraReservaId.Value);
                                cmdNotif.Parameters.AddWithValue("@UsuarioID", usuarioReservaId.Value);
                                cmdNotif.Parameters.AddWithValue("@Tipo", "LibroDisponibleCola");
                                var fechaTexto = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                                var mensaje = $"¡Buenas noticias! El libro '{tituloLibro ?? "Libro"}' que tenías en cola de espera ya está disponible. Fecha/Hora: {fechaTexto}";
                                cmdNotif.Parameters.AddWithValue("@Mensaje", mensaje);
                                cmdNotif.ExecuteNonQuery();

                                #if DEBUG
                                Console.WriteLine($"[ProcesarDevolucion] Reserva {primeraReservaId.Value} procesada. Movida a PorAprobar/Retiro. Notificación creada para usuario {usuarioReservaId.Value}");
                                #endif
                            }
                            else
                            {
                                #if DEBUG
                                Console.WriteLine($"[ProcesarDevolucion] No hay reservas en cola para el libro {libroId.Value}. Ejemplar {ejemplarId.Value} queda como 'Disponible'");
                                #endif
                            }
                        }

                        // Crear notificación para el usuario que realizó la devolución
                        if (usuarioDevolucionId.HasValue && reservaIdDelPrestamo.HasValue)
                        {
                            // Obtener título del libro para el préstamo devuelto
                            string? tituloLibroDev = null;
                            using (var cmdTituloDev = new SqlCommand(@"
                                SELECT TOP 1 l.Titulo
                                FROM Reservas r
                                LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID
                                LEFT JOIN Libros l ON l.LibroID = ISNULL(e.LibroID, r.LibroID)
                                WHERE r.ReservaID = @ReservaID", cn, transaction))
                            {
                                cmdTituloDev.Parameters.AddWithValue("@ReservaID", reservaIdDelPrestamo.Value);
                                var val = cmdTituloDev.ExecuteScalar();
                                if (val != null && val != DBNull.Value)
                                    tituloLibroDev = Convert.ToString(val);
                            }

                            var cmdInsertNotifDevolucion = new SqlCommand(@"
                                INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                                VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", cn, transaction);
                            cmdInsertNotifDevolucion.Parameters.AddWithValue("@ReservaID", reservaIdDelPrestamo.Value);
                            cmdInsertNotifDevolucion.Parameters.AddWithValue("@UsuarioID", usuarioDevolucionId.Value);
                            cmdInsertNotifDevolucion.Parameters.AddWithValue("@Tipo", "Devolucion");
                            var fechaTextoDev = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                            cmdInsertNotifDevolucion.Parameters.AddWithValue("@Mensaje", $"Se registró la devolución de tu préstamo del ejemplar {tituloLibroDev ?? "(sin título)"}. Fecha/Hora: {fechaTextoDev}");
                            cmdInsertNotifDevolucion.ExecuteNonQuery();
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

        public bool RenovarPrestamo(int prestamoId, int diasAdicionales = 15)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE Prestamos 
                    SET FechaVencimiento = DATEADD(day, @DiasAdicionales, FechaVencimiento),
                        Renovaciones = Renovaciones + 1
                    WHERE PrestamoID = @PrestamoID AND Estado = 'Prestado'", cn);
                
                cmd.Parameters.AddWithValue("@PrestamoID", prestamoId);
                cmd.Parameters.AddWithValue("@DiasAdicionales", diasAdicionales);
                
                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool TienePrestamosActivos(int ejemplarId)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 1 FROM Prestamos 
                    WHERE EjemplarID = @EjemplarID AND Estado = 'Prestado'", cn);
                cmd.Parameters.AddWithValue("@EjemplarID", ejemplarId);
                
                cn.Open();
                return cmd.ExecuteScalar() != null;
            }
        }

        public Prestamo? ObtenerPorId(int prestamoId)
        {
            using (var cn = GetConnection())
            {
                // En la versión actual la tabla Prestamos referencia a Reservas (ReservaID)
                // y la información de UsuarioID / EjemplarID está en la tabla Reservas.
                // Hacemos join con Reservas para obtener esos datos y evitar errores de "Invalid column name".
                var cmd = new SqlCommand(@"
                    SELECT p.PrestamoID, p.ReservaID, r.EjemplarID, r.UsuarioID, 
                           p.FechaPrestamo, p.FechaVencimiento, p.FechaDevolucion, p.Estado, p.Renovaciones, p.Observaciones
                    FROM Prestamos p
                    INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
                    WHERE p.PrestamoID = @PrestamoID", cn);
                cmd.Parameters.AddWithValue("@PrestamoID", prestamoId);
                
                cn.Open();
                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Prestamo
                        {
                            PrestamoID = Convert.ToInt32(dr["PrestamoID"]),
                            // EjemplarID y UsuarioID vienen desde la reserva vinculada
                            EjemplarID = dr["EjemplarID"] != DBNull.Value ? Convert.ToInt32(dr["EjemplarID"]) : 0,
                            UsuarioID = dr["UsuarioID"] != DBNull.Value ? Convert.ToInt32(dr["UsuarioID"]) : 0,
                            FechaPrestamo = Convert.ToDateTime(dr["FechaPrestamo"]),
                            FechaVencimiento = Convert.ToDateTime(dr["FechaVencimiento"]),
                            FechaDevolucion = dr["FechaDevolucion"] != DBNull.Value ? Convert.ToDateTime(dr["FechaDevolucion"]) : null,
                            Estado = dr["Estado"].ToString() ?? "",
                            Renovaciones = dr["Renovaciones"] != DBNull.Value ? Convert.ToInt32(dr["Renovaciones"]) : 0,
                            Observaciones = dr["Observaciones"]?.ToString()
                        };
                    }
                }
            }

            return null;
        }
    }
}
