using System;
using System.Data;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Helpers;

namespace NeoLibroAPI.Data
{
    public class ReservaRepository : IReservaRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly string _connectionString;

        public ReservaRepository(ApplicationDbContext context, string connectionString)
        {
            _context = context;
            _connectionString = connectionString;
        }

        public async Task<Reserva> CrearReserva(int usuarioId, int libroId, string tipoReserva, int? ejemplarId = null)
        {
            // Verificar si ya existe una reserva activa
            if (await ExisteReservaActiva(usuarioId, libroId))
                throw new InvalidOperationException("Ya existe una reserva activa para este libro.");

            // Si se especifica un ejemplar, verificar que exista y pertenezca al libro
            if (ejemplarId.HasValue)
            {
                var ejemplar = await _context.Ejemplares.FindAsync(ejemplarId.Value);
                if (ejemplar == null || ejemplar.LibroID != libroId)
                    throw new InvalidOperationException("El ejemplar especificado no existe o no pertenece al libro seleccionado.");
            }

            var fechaLimite = await CalcularFechaLimiteRetiro(libroId);

            // Determinar estado inicial y tipo de reserva basado en disponibilidad
            var hayDisponible = await _context.Ejemplares.AnyAsync(e => e.LibroID == libroId && e.Estado == "Disponible");
            
            // Si el ejemplar NO está disponible, SIEMPRE es cola de espera (tanto Estado como TipoReserva)
            string estadoInicial, tipoEfectivo;
            if (!hayDisponible) {
                estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                tipoEfectivo = "ColaEspera";
            } else {
                estadoInicial = NeoLibroAPI.Models.ReservaEstados.PorAprobar;
                tipoEfectivo = "Retiro";
            }

            // Si se especificó un ejemplar, verificar su disponibilidad y ajustar tipo/estado
            if (ejemplarId.HasValue)
            {
                var ejemplar = await _context.Ejemplares.FindAsync(ejemplarId.Value);
                if (ejemplar == null || ejemplar.LibroID != libroId)
                    throw new InvalidOperationException("El ejemplar especificado no existe o no pertenece al libro seleccionado.");

                if (ejemplar.Estado == "Disponible")
                {
                    tipoEfectivo = "Retiro";
                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.PorAprobar;
                }
                else
                {
                    // Si el ejemplar no está disponible, SIEMPRE es cola de espera
                    tipoEfectivo = "ColaEspera";
                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                    // Limpiar el ejemplarId ya que irá a cola
                    ejemplarId = null;
                }
            }

            // Usar el procedimiento almacenado para asignar ejemplar de forma atómica (evita condiciones de carrera)
            if (tipoEfectivo == "Retiro")
            {
                try
                {
                    using var conn = new SqlConnection(_connectionString);
                    await conn.OpenAsync();

                    using var cmd = new SqlCommand("sp_AsignarEjemplarParaReserva", conn);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@LibroID", libroId);
                    if (ejemplarId.HasValue)
                        cmd.Parameters.AddWithValue("@RequestedEjemplarID", ejemplarId.Value);
                    else
                        cmd.Parameters.AddWithValue("@RequestedEjemplarID", DBNull.Value);

                    var outParam = new SqlParameter("@EjemplarAsignado", SqlDbType.Int) { Direction = ParameterDirection.Output };
                    cmd.Parameters.Add(outParam);

                    await cmd.ExecuteNonQueryAsync();

                    var asignado = (int)(outParam.Value ?? 0);
                    if (asignado > 0)
                    {
                        ejemplarId = asignado;
                        estadoInicial = NeoLibroAPI.Models.ReservaEstados.PorAprobar;
                        tipoEfectivo = "Retiro";
                    }
                    else
                    {
                        // No se asignó ejemplar -> pasar a cola
                        ejemplarId = null;
                        tipoEfectivo = "ColaEspera";
                        estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error al invocar sp_AsignarEjemplarParaReserva: {ex.Message}");
                    // Si el SP no existe (SQL error 2812) o fallo puntual, intentar fallback con EF para reservar el ejemplar
                    var sqlEx = ex as SqlException;
                    if (sqlEx != null && sqlEx.Number == 2812)
                    {
                        Console.WriteLine("Stored procedure no encontrado, intentando asignación mediante EF como fallback...");
                    }

                    try
                    {
                        // Fallback: intentar asignar ejemplar disponible via EF con transacción
                        using var efTx = await _context.Database.BeginTransactionAsync();

                        if (tipoEfectivo == "Retiro")
                        {
                            if (!ejemplarId.HasValue)
                            {
                                var ejemplarDisponible = await _context.Ejemplares
                                    .Where(e => e.LibroID == libroId && e.Estado == "Disponible")
                                    .OrderBy(e => e.FechaAlta)
                                    .FirstOrDefaultAsync();

                                if (ejemplarDisponible != null)
                                {
                                    ejemplarId = ejemplarDisponible.EjemplarID;
                                    ejemplarDisponible.Estado = "Reservado";
                                    _context.Ejemplares.Update(ejemplarDisponible);
                                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.PorAprobar;
                                    tipoEfectivo = "Retiro";
                                }
                                else
                                {
                                    ejemplarId = null;
                                    tipoEfectivo = "ColaEspera";
                                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                                }
                            }
                            else
                            {
                                var ejemplar = await _context.Ejemplares.FindAsync(ejemplarId.Value);
                                if (ejemplar != null && ejemplar.LibroID == libroId && ejemplar.Estado == "Disponible")
                                {
                                    ejemplar.Estado = "Reservado";
                                    _context.Ejemplares.Update(ejemplar);
                                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.PorAprobar;
                                    tipoEfectivo = "Retiro";
                                }
                                else
                                {
                                    ejemplarId = null;
                                    tipoEfectivo = "ColaEspera";
                                    estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                                }
                            }
                        }

                        await _context.SaveChangesAsync();
                        await efTx.CommitAsync();
                    }
                    catch (Exception efEx)
                    {
                        Console.WriteLine($"Fallback EF falló al asignar ejemplar: {efEx.Message}");
                        // Finalmente degradar a cola para no impedir la creación
                        ejemplarId = null;
                        tipoEfectivo = "ColaEspera";
                        estadoInicial = NeoLibroAPI.Models.ReservaEstados.ColaEspera;
                    }
                }
            }

            // Crear la reserva mediante EF (estado y ejemplar ya determinados)
            var reserva = new Reserva
            {
                UsuarioID = usuarioId,
                LibroID = libroId,
                EjemplarID = ejemplarId,
                FechaReserva = DateTime.Now,
                Estado = estadoInicial,
                TipoReserva = tipoEfectivo,
                FechaLimiteRetiro = fechaLimite,
                PrioridadCola = await _context.Reservas
                    .Where(r => r.LibroID == libroId && r.Estado != NeoLibroAPI.Models.ReservaEstados.Completada && r.Estado != NeoLibroAPI.Models.ReservaEstados.Cancelada && r.Estado != NeoLibroAPI.Models.ReservaEstados.Expirada)
                    .CountAsync() + 1
            };

            _context.Reservas.Add(reserva);
            await _context.SaveChangesAsync();

            // Crear notificación para el estudiante que hizo la reserva
            try
            {
                // Obtener título del libro usando SQL directo para evitar problemas con NULLs
                string tituloLibro = "Libro";
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmdLibro = new SqlCommand(@"
                        SELECT ISNULL(Titulo, 'Libro') as Titulo
                        FROM Libros
                        WHERE LibroID = @LibroID", connection))
                    {
                        cmdLibro.Parameters.AddWithValue("@LibroID", libroId);
                        var resultado = await cmdLibro.ExecuteScalarAsync();
                        if (resultado != null && resultado != DBNull.Value)
                            tituloLibro = resultado.ToString() ?? "Libro";
                    }
                }

                var mensajeReserva = reserva.TipoReserva == "ColaEspera"
                    ? $"Tu reserva del libro '{tituloLibro}' ha sido agregada a la cola de espera. Te notificaremos cuando esté disponible."
                    : $"Tu reserva del libro '{tituloLibro}' ha sido creada.";

                var tipoNotificacion = reserva.TipoReserva == "ColaEspera" ? "ReservaColaEspera" : "ReservaCreada";
                
                #if DEBUG
                Console.WriteLine($"[CrearReserva] Creando notificación para usuario {usuarioId}, ReservaID: {reserva.ReservaID}, Tipo: {tipoNotificacion}");
                #endif

                // Usar SQL directo para crear la notificación (más confiable que EF con NULLs)
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var cmdNotif = new SqlCommand(@"
                        INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                        VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", connection))
                    {
                        cmdNotif.Parameters.AddWithValue("@ReservaID", reserva.ReservaID);
                        cmdNotif.Parameters.AddWithValue("@UsuarioID", usuarioId);
                        cmdNotif.Parameters.AddWithValue("@Tipo", tipoNotificacion);
                        cmdNotif.Parameters.AddWithValue("@Mensaje", mensajeReserva);
                        var rowsAffected = await cmdNotif.ExecuteNonQueryAsync();
                        
                        #if DEBUG
                        Console.WriteLine($"[CrearReserva] Notificación creada exitosamente. Filas afectadas: {rowsAffected}");
                        #endif
                    }
                }
            }
            catch (Exception ex)
            {
                // Log el error pero no fallar la creación de la reserva
                Console.WriteLine($"[CrearReserva] Error al crear notificación: {ex.Message}");
                Console.WriteLine($"[CrearReserva] StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[CrearReserva] InnerException: {ex.InnerException.Message}");
                }
            }

            if (reserva.TipoReserva == "ColaEspera")
            {
                await ProcesarColaEspera(libroId);
            }

            return reserva;
        }

        public async Task<IEnumerable<ReservaDTO>> ListarReservasPorUsuario(int usuarioId)
        {
            try
            {
                // Usar SQL directo para evitar problemas con NULLs en Entity Framework
                var resultado = new List<ReservaDTO>();
                
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(@"
                        SELECT 
                            r.ReservaID,
                            r.UsuarioID,
                            r.LibroID,
                            r.FechaReserva,
                            ISNULL(r.Estado, 'Desconocido') as Estado,
                            ISNULL(r.TipoReserva, 'ColaEspera') as TipoReserva,
                            r.FechaLimiteRetiro,
                            r.PrioridadCola,
                            ISNULL(l.Titulo, '[Libro no encontrado]') as LibroTitulo,
                            ISNULL(l.ISBN, '') as LibroISBN
                        FROM Reservas r
                        LEFT JOIN Libros l ON r.LibroID = l.LibroID
                        WHERE r.UsuarioID = @UsuarioID
                        ORDER BY r.FechaReserva DESC", connection))
                    {
                        command.Parameters.AddWithValue("@UsuarioID", usuarioId);
                        
                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                resultado.Add(new ReservaDTO
                                {
                                    ReservaID = reader.GetInt32("ReservaID"),
                                    UsuarioID = reader.GetInt32("UsuarioID"),
                                    LibroID = reader.GetInt32("LibroID"),
                                    FechaReserva = reader.GetDateTime("FechaReserva"),
                                    Estado = reader.GetString("Estado"),
                                    TipoReserva = reader.GetString("TipoReserva"),
                                    FechaLimiteRetiro = reader.IsDBNull("FechaLimiteRetiro") ? (DateTime?)null : reader.GetDateTime("FechaLimiteRetiro"),
                                    PosicionCola = reader.IsDBNull("PrioridadCola") ? (int?)null : reader.GetInt32("PrioridadCola"),
                                    LibroTitulo = reader.GetString("LibroTitulo"),
                                    LibroISBN = reader.IsDBNull("LibroISBN") ? null : reader.GetString("LibroISBN")
                                });
                            }
                        }
                    }
                }
                
                Console.WriteLine($"[ListarReservasPorUsuario] Total reservas recuperadas para usuario {usuarioId}: {resultado.Count}");
                foreach (var reserva in resultado)
                {
                    Console.WriteLine($"[ListarReservasPorUsuario] ReservaID: {reserva.ReservaID}, Estado: {reserva.Estado}, Libro: {reserva.LibroTitulo}");
                }
                
                return resultado;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ListarReservasPorUsuario] Error al listar reservas de usuario {usuarioId}: {ex.Message}");
                Console.WriteLine($"[ListarReservasPorUsuario] StackTrace: {ex.StackTrace}");
                // En lugar de lanzar, devolver lista vacía para evitar errores en el frontend
                return new List<ReservaDTO>();
            }
        }

        public async Task<IEnumerable<AdminReservaDTO>> ListarReservasParaRetiro()
        {
            // Incluir reservas que están listas para retiro:
            // - TipoReserva == "Retiro" O Estado == "PorAprobar" O Estado == "Aprobada"
            // - Excluir estados finales (Cancelada, Completada, Expirada)
            // - Excluir reservas en cola (Estado == "ColaEspera")
            var query = from r in _context.Reservas
                       join u in _context.Usuarios on r.UsuarioID equals u.UsuarioID
                       join l in _context.Libros on r.LibroID equals l.LibroID
                       join e in _context.Ejemplares on r.EjemplarID equals e.EjemplarID into ejemplarJoin
                       from e in ejemplarJoin.DefaultIfEmpty()
                       where (r.TipoReserva == "Retiro" 
                             || r.Estado == NeoLibroAPI.Models.ReservaEstados.PorAprobar
                             || r.Estado == NeoLibroAPI.Models.ReservaEstados.Aprobada)
                             && r.Estado != NeoLibroAPI.Models.ReservaEstados.Cancelada 
                             && r.Estado != NeoLibroAPI.Models.ReservaEstados.Completada 
                             && r.Estado != NeoLibroAPI.Models.ReservaEstados.Expirada
                             && r.Estado != NeoLibroAPI.Models.ReservaEstados.ColaEspera
                       orderby r.FechaReserva
                       select new AdminReservaDTO
                       {
                           ReservaID = r.ReservaID,
                           UsuarioID = r.UsuarioID,
                           LibroID = r.LibroID,
                           FechaReserva = r.FechaReserva,
                           Estado = r.Estado,
                           TipoReserva = r.TipoReserva,
                           LibroTitulo = l.Titulo,
                           NombreUsuario = u.Nombre,
                           UsuarioNombre = u.Nombre,
                           CodigoUsuario = u.CodigoUniversitario,
                           NumeroEjemplar = e != null ? e.NumeroEjemplar : null,
                           CodigoBarras = e != null ? e.CodigoBarras : null
                       };

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<AdminReservaDTO>> ListarReservasEnEspera()
        {
            // Solo mostrar reservas que están realmente en cola de espera
            // Estado debe ser ColaEspera Y TipoReserva debe ser ColaEspera
            var query = from r in _context.Reservas
                       join u in _context.Usuarios on r.UsuarioID equals u.UsuarioID
                       join l in _context.Libros on r.LibroID equals l.LibroID
                       join e in _context.Ejemplares on r.EjemplarID equals e.EjemplarID into ejemplarJoin
                       from e in ejemplarJoin.DefaultIfEmpty()
                       where r.Estado == NeoLibroAPI.Models.ReservaEstados.ColaEspera 
                             && r.TipoReserva == "ColaEspera"
                       orderby r.LibroID, r.PrioridadCola ?? int.MaxValue
                       select new AdminReservaDTO
                       {
                           ReservaID = r.ReservaID,
                           UsuarioID = r.UsuarioID,
                           LibroID = r.LibroID,
                           FechaReserva = r.FechaReserva,
                           Estado = r.Estado,
                           TipoReserva = r.TipoReserva,
                           LibroTitulo = l.Titulo,
                           NombreUsuario = u.Nombre,
                           UsuarioNombre = u.Nombre,
                           CodigoUsuario = u.CodigoUniversitario,
                           PosicionCola = r.PrioridadCola,
                           NumeroEjemplar = e != null ? e.NumeroEjemplar : null,
                           CodigoBarras = e != null ? e.CodigoBarras : null
                       };

            return await query.ToListAsync();
        }

        public async Task<bool> CancelarReserva(int reservaId, int usuarioId, bool esAdmin)
        {
            var reserva = await _context.Reservas
                .FirstOrDefaultAsync(r => r.ReservaID == reservaId && r.Estado != NeoLibroAPI.Models.ReservaEstados.Completada && r.Estado != NeoLibroAPI.Models.ReservaEstados.Cancelada && r.Estado != NeoLibroAPI.Models.ReservaEstados.Expirada);

            if (reserva == null || (!esAdmin && reserva.UsuarioID != usuarioId))
                return false;

            reserva.Estado = NeoLibroAPI.Models.ReservaEstados.Cancelada;
            await _context.SaveChangesAsync();

            // Si el admin rechazó la reserva, notificar al estudiante
            if (esAdmin && reserva.UsuarioID != usuarioId)
            {
                try
                {
                    // Obtener título del libro usando SQL directo
                    string tituloLibro = "Libro";
                    using (var connection = new SqlConnection(_connectionString))
                    {
                        await connection.OpenAsync();
                        using (var cmdLibro = new SqlCommand(@"
                            SELECT ISNULL(Titulo, 'Libro') as Titulo
                            FROM Libros
                            WHERE LibroID = @LibroID", connection))
                        {
                            cmdLibro.Parameters.AddWithValue("@LibroID", reserva.LibroID);
                            var resultado = await cmdLibro.ExecuteScalarAsync();
                            if (resultado != null && resultado != DBNull.Value)
                                tituloLibro = resultado.ToString() ?? "Libro";
                        }

                        // Crear notificación de rechazo
                        using (var cmdNotif = new SqlCommand(@"
                            INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                            VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", connection))
                        {
                            cmdNotif.Parameters.AddWithValue("@ReservaID", reserva.ReservaID);
                            cmdNotif.Parameters.AddWithValue("@UsuarioID", reserva.UsuarioID);
                            cmdNotif.Parameters.AddWithValue("@Tipo", "ReservaRechazada");
                            var mensajeRechazo = $"Tu reserva del libro '{tituloLibro}' ha sido rechazada por el administrador. Por favor, contacta con la biblioteca para más información.";
                            cmdNotif.Parameters.AddWithValue("@Mensaje", mensajeRechazo);
                            await cmdNotif.ExecuteNonQueryAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CancelarReserva] Error al crear notificación de rechazo: {ex.Message}");
                }
            }

            // Si era una reserva en cola, actualizar prioridades
            if (reserva.TipoReserva == "ColaEspera")
            {
                await ActualizarPrioridadesCola(reserva.LibroID);
                await ProcesarColaEspera(reserva.LibroID);
            }

            return true;
        }

        public async Task<bool> ActualizarTipoReserva(int reservaId, string nuevoTipo)
        {
            var reserva = await _context.Reservas.FindAsync(reservaId);
            if (reserva == null) return false;

            reserva.TipoReserva = nuevoTipo;
            if (nuevoTipo == "Retiro")
            {
                reserva.FechaLimiteRetiro = await CalcularFechaLimiteRetiro(reserva.LibroID);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarcarComoCompletada(int reservaId)
        {
            var reserva = await _context.Reservas.FindAsync(reservaId);
            if (reserva == null) return false;

            reserva.Estado = NeoLibroAPI.Models.ReservaEstados.Completada;
            await _context.SaveChangesAsync();

            if (reserva.TipoReserva == "ColaEspera")
            {
                await ActualizarPrioridadesCola(reserva.LibroID);
                await ProcesarColaEspera(reserva.LibroID);
            }

            return true;
        }

        public async Task<int> ObtenerPosicionEnCola(int libroId, int reservaId)
        {
            var prioridadReserva = await _context.Reservas
                .Where(r2 => r2.ReservaID == reservaId)
                .Select(r2 => r2.PrioridadCola)
                .FirstOrDefaultAsync();

            if (!prioridadReserva.HasValue)
                return 0;

            return await _context.Reservas
                .CountAsync(r => r.LibroID == libroId 
                            && r.Estado == NeoLibroAPI.Models.ReservaEstados.ColaEspera 
                            && r.TipoReserva == "ColaEspera"
                            && r.PrioridadCola.HasValue
                            && r.PrioridadCola < prioridadReserva.Value);
        }

        public async Task<bool> ProcesarColaEspera(int libroId)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            
            try
            {
                // Primero, verificar si hay ejemplares disponibles
                int? ejemplarDisponibleId = null;
                using (var cmdEjemplar = new SqlCommand(@"
                    SELECT TOP 1 EjemplarID
                    FROM Ejemplares
                    WHERE LibroID = @LibroID AND Estado = 'Disponible'
                    ORDER BY FechaAlta", connection))
                {
                    cmdEjemplar.Parameters.AddWithValue("@LibroID", libroId);
                    var resultado = await cmdEjemplar.ExecuteScalarAsync();
                    if (resultado != null && resultado != DBNull.Value)
                        ejemplarDisponibleId = Convert.ToInt32(resultado);
                }

                // Si hay ejemplar disponible, procesar la primera reserva en cola
                if (ejemplarDisponibleId.HasValue)
                {
                    // Obtener la primera reserva en cola
                    int? primeraReservaId = null;
                    int? usuarioReservaId = null;
                    string? tituloLibro = null;
                    
                    using (var cmdReserva = new SqlCommand(@"
                        SELECT TOP 1 r.ReservaID, r.UsuarioID, ISNULL(l.Titulo, 'Libro') as Titulo
                        FROM Reservas r
                        LEFT JOIN Libros l ON r.LibroID = l.LibroID
                        WHERE r.LibroID = @LibroID 
                        AND r.Estado = 'ColaEspera'
                        AND r.TipoReserva = 'ColaEspera'
                        ORDER BY 
                            CASE WHEN r.PrioridadCola IS NULL THEN 999999 ELSE r.PrioridadCola END,
                            r.FechaReserva", connection))
                    {
                        cmdReserva.Parameters.AddWithValue("@LibroID", libroId);
                        using (var reader = await cmdReserva.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                primeraReservaId = reader.GetInt32("ReservaID");
                                usuarioReservaId = reader.GetInt32("UsuarioID");
                                tituloLibro = reader.GetString("Titulo");
                            }
                        }
                    }

                    if (primeraReservaId.HasValue && usuarioReservaId.HasValue)
                    {
                        // Actualizar la reserva: asignar ejemplar y cambiar a Retiro
                        using (var cmdUpdate = new SqlCommand(@"
                            UPDATE Reservas 
                            SET EjemplarID = @EjemplarID,
                                TipoReserva = 'Retiro',
                                Estado = 'PorAprobar',
                                FechaLimiteRetiro = DATEADD(day, 2, GETDATE()),
                                PrioridadCola = NULL
                            WHERE ReservaID = @ReservaID", connection))
                        {
                            cmdUpdate.Parameters.AddWithValue("@EjemplarID", ejemplarDisponibleId.Value);
                            cmdUpdate.Parameters.AddWithValue("@ReservaID", primeraReservaId.Value);
                            await cmdUpdate.ExecuteNonQueryAsync();
                        }

                        // Marcar el ejemplar como Reservado
                        using (var cmdEjemplar = new SqlCommand(@"
                            UPDATE Ejemplares 
                            SET Estado = 'Reservado'
                            WHERE EjemplarID = @EjemplarID", connection))
                        {
                            cmdEjemplar.Parameters.AddWithValue("@EjemplarID", ejemplarDisponibleId.Value);
                            await cmdEjemplar.ExecuteNonQueryAsync();
                        }

                        // Crear notificación para el estudiante
                        using (var cmdNotif = new SqlCommand(@"
                            INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                            VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", connection))
                        {
                            cmdNotif.Parameters.AddWithValue("@ReservaID", primeraReservaId.Value);
                            cmdNotif.Parameters.AddWithValue("@UsuarioID", usuarioReservaId.Value);
                            cmdNotif.Parameters.AddWithValue("@Tipo", "LibroDisponibleCola");
                            var fechaTexto = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                            var mensaje = $"¡Buenas noticias! El libro '{tituloLibro ?? "Libro"}' que tenías en cola de espera ya está disponible. Fecha/Hora: {fechaTexto}";
                            cmdNotif.Parameters.AddWithValue("@Mensaje", mensaje);
                            await cmdNotif.ExecuteNonQueryAsync();
                        }

                        #if DEBUG
                        Console.WriteLine($"[ProcesarColaEspera] Reserva {primeraReservaId.Value} procesada. Notificación creada para usuario {usuarioReservaId.Value}");
                        #endif
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProcesarColaEspera] Error: {ex.Message}");
                throw;
            }
        }

        public async Task<int> AprobarReserva(int reservaId, int administradorId)
        {
            // Usar procedimiento almacenado transaccional que asigna ejemplar y crea préstamo evitando condiciones de carrera
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                // Obtener el rol del usuario que hizo la reserva para determinar los días de préstamo
                string? rolUsuario = null;
                using (var cmdRol = new SqlCommand(@"
                    SELECT u.Rol 
                    FROM Reservas r
                    INNER JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
                    WHERE r.ReservaID = @ReservaID", connection))
                {
                    cmdRol.Parameters.AddWithValue("@ReservaID", reservaId);
                    var rolResult = await cmdRol.ExecuteScalarAsync();
                    if (rolResult != null && rolResult != DBNull.Value)
                    {
                        rolUsuario = rolResult.ToString();
                        Console.WriteLine($"[AprobarReserva] Rol obtenido de BD: '{rolUsuario}'");
                    }
                    else
                    {
                        Console.WriteLine("[AprobarReserva] ADVERTENCIA: No se pudo obtener el rol del usuario");
                    }
                }

                // Leer configuración dinámicamente para obtener los días de préstamo según el rol
                // Esto asegura que los cambios en el panel de admin se reflejen inmediatamente
                Console.WriteLine($"[AprobarReserva] Llamando a ConfiguracionHelper.ObtenerDiasPrestamoPorRol con rol: '{rolUsuario}'");
                int diasPrestamo = ConfiguracionHelper.ObtenerDiasPrestamoPorRol(rolUsuario);
                Console.WriteLine($"[AprobarReserva] Días de préstamo calculados: {diasPrestamo}");

                // Validar que los días de préstamo sean válidos (debe ser > 0)
                if (diasPrestamo <= 0)
                {
                    Console.WriteLine($"[AprobarReserva] ERROR: Días de préstamo inválidos ({diasPrestamo}), usando 3 días por defecto");
                    diasPrestamo = 3; // Valor seguro para estudiantes
                }

                using var command = new SqlCommand("sp_AprobarReserva_CrearPrestamo", connection);
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@ReservaID", reservaId);
                command.Parameters.AddWithValue("@AdministradorID", administradorId);
                
                // Asegurar que el parámetro se pase explícitamente (no usar el valor por defecto del SP)
                var paramDiasPrestamo = new SqlParameter("@DiasPrestamo", SqlDbType.Int);
                paramDiasPrestamo.Value = diasPrestamo;
                command.Parameters.Add(paramDiasPrestamo);
                
                Console.WriteLine($"[AprobarReserva] Ejecutando stored procedure con @DiasPrestamo = {diasPrestamo}");

                var returnParam = command.Parameters.Add("@ReturnVal", SqlDbType.Int);
                returnParam.Direction = ParameterDirection.ReturnValue;

                try
                {
                    await command.ExecuteNonQueryAsync();
                }
                catch (SqlException sqlEx)
                {
                    Console.WriteLine($"[AprobarReserva] Error SQL al ejecutar stored procedure: {sqlEx.Message}");
                    Console.WriteLine($"[AprobarReserva] Número de error: {sqlEx.Number}");
                    throw;
                }

                var ret = (int)(returnParam.Value ?? -99);
                Console.WriteLine($"[AprobarReserva] Stored procedure retornó: {ret}");

                // Crear notificación al usuario según resultado
                if (ret >= 0)
                {
                    // Obtener UsuarioID de la reserva
                    int? usuarioId = null;
                    string? tituloLibro = null;
                    using (var cmdUsuario = new SqlCommand("SELECT UsuarioID FROM Reservas WHERE ReservaID = @ReservaID", connection))
                    {
                        cmdUsuario.Parameters.AddWithValue("@ReservaID", reservaId);
                        var val = await cmdUsuario.ExecuteScalarAsync();
                        if (val != null && val != DBNull.Value)
                            usuarioId = Convert.ToInt32(val);
                    }

                    // Obtener título del libro (si hay ejemplar asignado tras aprobar o al menos por LibroID)
                    using (var cmdTitulo = new SqlCommand(@"
                        SELECT TOP 1 l.Titulo
                        FROM Reservas r
                        LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID
                        LEFT JOIN Libros l ON l.LibroID = ISNULL(e.LibroID, r.LibroID)
                        WHERE r.ReservaID = @ReservaID", connection))
                    {
                        cmdTitulo.Parameters.AddWithValue("@ReservaID", reservaId);
                        var val = await cmdTitulo.ExecuteScalarAsync();
                        if (val != null && val != DBNull.Value)
                            tituloLibro = Convert.ToString(val);
                    }

                    if (usuarioId.HasValue)
                    {
                        // Si se creó un préstamo (ret > 0), eliminar la notificación genérica que creó el stored procedure
                        // y crear la notificación detallada con el nombre del ejemplar
                        if (ret > 0)
                        {
                            // Eliminar la notificación genérica del stored procedure
                            using (var cmdEliminarNotif = new SqlCommand(@"
                                DELETE FROM Notificaciones 
                                WHERE ReservaID = @ReservaID 
                                AND Tipo = 'PrestamoCreado' 
                                AND Mensaje = 'Se ha creado tu préstamo y el ejemplar está listo para retiro.'", connection))
                            {
                                cmdEliminarNotif.Parameters.AddWithValue("@ReservaID", reservaId);
                                var filasEliminadas = await cmdEliminarNotif.ExecuteNonQueryAsync();
                                Console.WriteLine($"[AprobarReserva] Notificación genérica eliminada. Filas afectadas: {filasEliminadas}");
                            }
                        }

                        // Crear la notificación detallada (la que queremos mantener)
                        var tipo = ret > 0 ? "PrestamoCreado" : "ReservaAprobada";
                        var fechaTexto = DateTime.Now.ToString("yyyy-MM-dd HH:mm");
                        var mensaje = ret > 0
                            ? ($"Se ha creado tu préstamo del ejemplar {tituloLibro ?? "(sin título)"}. Fecha/Hora: {fechaTexto}")
                            : ($"Tu reserva fue aprobada para el libro {tituloLibro ?? "(sin título)"}. Fecha/Hora: {fechaTexto}");

                        using (var cmdNotif = new SqlCommand(@"INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
                                VALUES (@ReservaID, @UsuarioID, @Tipo, @Mensaje, GETDATE(), 'Pendiente')", connection))
                        {
                            cmdNotif.Parameters.AddWithValue("@ReservaID", reservaId);
                            cmdNotif.Parameters.AddWithValue("@UsuarioID", usuarioId.Value);
                            cmdNotif.Parameters.AddWithValue("@Tipo", tipo);
                            cmdNotif.Parameters.AddWithValue("@Mensaje", mensaje);
                            await cmdNotif.ExecuteNonQueryAsync();
                        }
                    }
                }

                // ret >= 0 -> éxito (>=1 PrestamoID, 0 aprobado sin préstamo). negativos -> errores
                if (ret < 0)
                {
                    string mensajeError = ret switch
                    {
                        -1 => "Reserva no encontrada",
                        -2 => "La reserva ya está en un estado final (Completada, Cancelada o Expirada)",
                        -3 => "Error en el esquema de la base de datos",
                        -99 => "Error interno en el procedimiento almacenado",
                        _ => $"Error desconocido (código: {ret})"
                    };
                    Console.WriteLine($"[AprobarReserva] Error del stored procedure: {mensajeError}");
                }
                return ret;
            }
            catch (SqlException sqlEx)
            {
                // Error específico de SQL (puede ser que el stored procedure no exista)
                Console.WriteLine($"[AprobarReserva] Error SQL: {sqlEx.Message}");
                Console.WriteLine($"[AprobarReserva] Número de error SQL: {sqlEx.Number}");
                if (sqlEx.Number == 2812) // Object not found
                {
                    Console.WriteLine("[AprobarReserva] ERROR: El stored procedure 'sp_AprobarReserva_CrearPrestamo' no existe en la base de datos");
                }
                return -99;
            }
            catch (Exception ex)
            {
                // Registrar/log si es necesario
                Console.WriteLine($"[AprobarReserva] Error al aprobar reserva y crear préstamo: {ex.Message}");
                Console.WriteLine($"[AprobarReserva] Stack trace: {ex.StackTrace}");
                return -99;
            }
        }

        public async Task<bool> ExpirarReserva(int reservaId)
        {
            var reserva = await _context.Reservas.FindAsync(reservaId);
            if (reserva == null) return false;

            // Solo expirar si está en estado Aprobada o PorAprobar
            if (reserva.Estado == NeoLibroAPI.Models.ReservaEstados.Completada || reserva.Estado == NeoLibroAPI.Models.ReservaEstados.Cancelada || reserva.Estado == NeoLibroAPI.Models.ReservaEstados.Expirada)
                return false;

            reserva.Estado = NeoLibroAPI.Models.ReservaEstados.Expirada;
            await _context.SaveChangesAsync();

            // Si era una reserva en cola, actualizar prioridades y procesar la cola
            if (reserva.TipoReserva == "ColaEspera")
            {
                await ActualizarPrioridadesCola(reserva.LibroID);
                await ProcesarColaEspera(reserva.LibroID);
            }

            // Notificar al usuario
            _context.Notificaciones.Add(new Notificacion
            {
                ReservaID = reserva.ReservaID,
                UsuarioID = reserva.UsuarioID,
                Tipo = "ReservaExpirada",
                Mensaje = "Tu reserva ha expirado por no ser recogida a tiempo.",
                FechaCreacion = DateTime.Now,
                Estado = "Pendiente"
            });
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<DateTime> CalcularFechaLimiteRetiro(int libroId)
        {
            // Por defecto, 2 días hábiles para retirar
            return await Task.FromResult(DateTime.Now.AddDays(2));
        }

        public async Task<bool> ExisteReservaActiva(int usuarioId, int libroId)
        {
            return await _context.Reservas
                .AnyAsync(r => r.UsuarioID == usuarioId 
                           && r.LibroID == libroId 
                           && (r.Estado == NeoLibroAPI.Models.ReservaEstados.ColaEspera 
                               || r.Estado == NeoLibroAPI.Models.ReservaEstados.PorAprobar 
                               || r.Estado == NeoLibroAPI.Models.ReservaEstados.Aprobada));
        }

        public async Task<bool> TieneReservasActivas(int usuarioId)
        {
            return await _context.Reservas
                .AnyAsync(r => r.UsuarioID == usuarioId && 
                           (r.Estado == NeoLibroAPI.Models.ReservaEstados.ColaEspera 
                            || r.Estado == NeoLibroAPI.Models.ReservaEstados.PorAprobar 
                            || r.Estado == NeoLibroAPI.Models.ReservaEstados.Aprobada));
        }

        private async Task ActualizarPrioridadesCola(int libroId)
        {
            // Actualizar prioridades solo para reservas que están realmente en cola de espera
            var reservasEnCola = await _context.Reservas
                .Where(r => r.LibroID == libroId 
                        && r.Estado == NeoLibroAPI.Models.ReservaEstados.ColaEspera 
                        && r.TipoReserva == "ColaEspera")
                .OrderBy(r => r.FechaReserva)
                .ToListAsync();

            int prioridad = 1;
            foreach (var reserva in reservasEnCola)
            {
                reserva.PrioridadCola = prioridad++;
            }

            await _context.SaveChangesAsync();
        }
    }
}


