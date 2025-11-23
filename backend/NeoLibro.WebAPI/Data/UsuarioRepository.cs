using System;
using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Usuarios
    /// Maneja todas las operaciones de acceso a datos para usuarios
    /// </summary>
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly string _cadenaConexion;

        public UsuarioRepository(string cadenaConexion) => _cadenaConexion = cadenaConexion;

        private SqlConnection GetConnection() => new SqlConnection(_cadenaConexion);

        public Usuario? ObtenerPorEmailInstitucional(string email)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT UsuarioID, CodigoUniversitario, Nombre, EmailInstitucional, 
                           ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena
                    FROM Usuarios 
                    WHERE EmailInstitucional = @EmailInstitucional", cn);
                cmd.Parameters.AddWithValue("@EmailInstitucional", email);

                cn.Open();
                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Usuario
                        {
                            UsuarioID = Convert.ToInt32(dr["UsuarioID"]),
                            CodigoUniversitario = dr["CodigoUniversitario"].ToString() ?? "",
                            Nombre = dr["Nombre"].ToString() ?? "",
                            EmailInstitucional = dr["EmailInstitucional"].ToString() ?? "",
                            ContrasenaHash = dr["ContrasenaHash"].ToString() ?? "",
                            Rol = dr["Rol"].ToString() ?? "",
                            Estado = Convert.ToBoolean(dr["Estado"]),
                            FechaRegistro = Convert.ToDateTime(dr["FechaRegistro"]),
                            FechaUltimaActualizacionContrasena = Convert.ToDateTime(dr["FechaUltimaActualizacionContrasena"])
                        };
                    }
                }
                return null;
            }
        }

        public bool ExisteEmailOCodigoUniversitario(string email, string codigoUniversitario)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT 1 FROM Usuarios 
                    WHERE EmailInstitucional = @Email OR CodigoUniversitario = @CodigoUniversitario", cn);

                cmd.Parameters.AddWithValue("@Email", email);
                cmd.Parameters.AddWithValue("@CodigoUniversitario", codigoUniversitario);

                cn.Open();
                var resultado = cmd.ExecuteScalar();
                return resultado != null;
            }
        }

        public List<string> ObtenerCodigosUniversitariosSimilares(string codigoBase)
        {
            var lista = new List<string>();

            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT CodigoUniversitario FROM Usuarios
                    WHERE CodigoUniversitario LIKE @CodigoBase + '%'", cn);

                cmd.Parameters.AddWithValue("@CodigoBase", codigoBase);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(dr["CodigoUniversitario"].ToString() ?? "");
                    }
                }
            }

            return lista;
        }

        public List<Usuario> Listar()
        {
            var lista = new List<Usuario>();

            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT UsuarioID, CodigoUniversitario, Nombre, EmailInstitucional, 
                           ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena
                    FROM Usuarios 
                    ORDER BY Nombre", cn);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Usuario
                        {
                            UsuarioID = Convert.ToInt32(dr["UsuarioID"]),
                            CodigoUniversitario = dr["CodigoUniversitario"].ToString() ?? "",
                            Nombre = dr["Nombre"].ToString() ?? "",
                            EmailInstitucional = dr["EmailInstitucional"].ToString() ?? "",
                            ContrasenaHash = dr["ContrasenaHash"].ToString() ?? "",
                            Rol = dr["Rol"].ToString() ?? "",
                            Estado = Convert.ToBoolean(dr["Estado"]),
                            FechaRegistro = Convert.ToDateTime(dr["FechaRegistro"]),
                            FechaUltimaActualizacionContrasena = Convert.ToDateTime(dr["FechaUltimaActualizacionContrasena"])
                        });
                    }
                }
            }

            return lista;
        }

        public bool Crear(Usuario obj)
        {
            try
            {
                using (var cn = GetConnection())
                {
                    using (var cmd = new SqlCommand(@"
                        INSERT INTO Usuarios (CodigoUniversitario, Nombre, EmailInstitucional, 
                                            ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena)
                        VALUES (@CodigoUniversitario, @Nombre, @EmailInstitucional, 
                                @ContrasenaHash, @Rol, @Estado, @FechaRegistro, @FechaUltimaActualizacionContrasena)", cn))
                    {
                        cmd.Parameters.AddWithValue("@CodigoUniversitario", obj.CodigoUniversitario ?? string.Empty);
                        cmd.Parameters.AddWithValue("@Nombre", obj.Nombre ?? string.Empty);
                        cmd.Parameters.AddWithValue("@EmailInstitucional", obj.EmailInstitucional ?? string.Empty);
                        cmd.Parameters.AddWithValue("@ContrasenaHash", obj.ContrasenaHash ?? string.Empty);
                        cmd.Parameters.AddWithValue("@Rol", obj.Rol ?? "Estudiante");
                        cmd.Parameters.AddWithValue("@Estado", obj.Estado);
                        cmd.Parameters.AddWithValue("@FechaRegistro", obj.FechaRegistro);
                        cmd.Parameters.AddWithValue("@FechaUltimaActualizacionContrasena", obj.FechaUltimaActualizacionContrasena);

                        cn.Open();
                        var resultado = cmd.ExecuteNonQuery();
                        return resultado > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                // Log del error (en producción usar un logger)
                Console.WriteLine($"Error en UsuarioRepository.Crear: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                throw; // Re-lanzar la excepción para que el controller la maneje
            }
        }

        public bool Modificar(Usuario obj)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    UPDATE Usuarios 
                    SET CodigoUniversitario = @CodigoUniversitario,
                        Nombre = @Nombre,
                        EmailInstitucional = @EmailInstitucional,
                        ContrasenaHash = @ContrasenaHash,
                        Rol = @Rol,
                        Estado = @Estado
                    WHERE UsuarioID = @UsuarioID", cn);
                
                cmd.Parameters.AddWithValue("@UsuarioID", obj.UsuarioID);
                cmd.Parameters.AddWithValue("@CodigoUniversitario", obj.CodigoUniversitario);
                cmd.Parameters.AddWithValue("@Nombre", obj.Nombre);
                cmd.Parameters.AddWithValue("@EmailInstitucional", obj.EmailInstitucional);
                cmd.Parameters.AddWithValue("@ContrasenaHash", obj.ContrasenaHash);
                cmd.Parameters.AddWithValue("@Rol", obj.Rol);
                cmd.Parameters.AddWithValue("@Estado", obj.Estado);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    UPDATE Usuarios 
                    SET Estado = 0 
                    WHERE UsuarioID = @UsuarioID", cn);
                cmd.Parameters.AddWithValue("@UsuarioID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public Usuario? ObtenerPorId(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT UsuarioID, CodigoUniversitario, Nombre, EmailInstitucional, 
                           ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena
                    FROM Usuarios 
                    WHERE UsuarioID = @UsuarioID", cn);
                cmd.Parameters.AddWithValue("@UsuarioID", id);

                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Usuario
                        {
                            UsuarioID = Convert.ToInt32(dr["UsuarioID"]),
                            CodigoUniversitario = dr["CodigoUniversitario"].ToString() ?? "",
                            Nombre = dr["Nombre"].ToString() ?? "",
                            EmailInstitucional = dr["EmailInstitucional"].ToString() ?? "",
                            ContrasenaHash = dr["ContrasenaHash"].ToString() ?? "",
                            Rol = dr["Rol"].ToString() ?? "",
                            Estado = Convert.ToBoolean(dr["Estado"]),
                            FechaRegistro = Convert.ToDateTime(dr["FechaRegistro"]),
                            FechaUltimaActualizacionContrasena = Convert.ToDateTime(dr["FechaUltimaActualizacionContrasena"])
                        };
                    }
                }
            }

            return null;
        }

        // ===== MÉTODOS PARA ESTADÍSTICAS DE USUARIO =====

        public EstadisticasUsuarioDTO ObtenerEstadisticasUsuario(int usuarioId)
        {
            try
            {
                using (SqlConnection cn = GetConnection())
                {
                    cn.Open();
                    
                    // Corregir automáticamente multas pendientes de préstamos ya devueltos
                    using (var cmdCorregir = new SqlCommand(@"
                        UPDATE Multas 
                        SET Estado = 'Pagada', FechaCobro = GETDATE()
                        WHERE Estado = 'Pendiente'
                        AND PrestamoID IN (
                            SELECT PrestamoID 
                            FROM Prestamos 
                            WHERE Estado = 'Devuelto'
                        )", cn))
                    {
                        cmdCorregir.ExecuteNonQuery();
                    }

                    SqlCommand cmd = new SqlCommand(@"
                        SELECT 
                            (SELECT COUNT(*) FROM Prestamos p 
                             INNER JOIN Reservas r ON p.ReservaID = r.ReservaID 
                             WHERE r.UsuarioID = @UsuarioID) as TotalPrestamos,
                            (SELECT COUNT(*) FROM Prestamos p 
                             INNER JOIN Reservas r ON p.ReservaID = r.ReservaID 
                             WHERE r.UsuarioID = @UsuarioID AND p.Estado = 'Prestado') as PrestamosActivos,
                            (SELECT COUNT(*) FROM Prestamos p 
                             INNER JOIN Reservas r ON p.ReservaID = r.ReservaID 
                             WHERE r.UsuarioID = @UsuarioID 
                             AND p.Estado = 'Devuelto' 
                             AND p.FechaDevolucion IS NOT NULL
                             AND YEAR(p.FechaDevolucion) = YEAR(GETDATE())) as PrestamosCompletados,
                            (SELECT COUNT(*) FROM Multas WHERE UsuarioID = @UsuarioID) as TotalMultas,
                            (SELECT COUNT(*) FROM Multas WHERE UsuarioID = @UsuarioID AND Estado = 'Pendiente') as MultasPendientes,
                            (SELECT ISNULL(SUM(Monto), 0) FROM Multas WHERE UsuarioID = @UsuarioID AND Estado = 'Pendiente') as MontoMultasPendientes", cn);
                    cmd.Parameters.AddWithValue("@UsuarioID", usuarioId);

                    using (SqlDataReader dr = cmd.ExecuteReader())
                    {
                        if (dr.Read())
                        {
                            return new EstadisticasUsuarioDTO
                            {
                                TotalPrestamos = dr["TotalPrestamos"] == DBNull.Value ? 0 : Convert.ToInt32(dr["TotalPrestamos"]),
                                PrestamosActivos = dr["PrestamosActivos"] == DBNull.Value ? 0 : Convert.ToInt32(dr["PrestamosActivos"]),
                                PrestamosCompletados = dr["PrestamosCompletados"] == DBNull.Value ? 0 : Convert.ToInt32(dr["PrestamosCompletados"]),
                                TotalMultas = dr["TotalMultas"] == DBNull.Value ? 0 : Convert.ToInt32(dr["TotalMultas"]),
                                MultasPendientes = dr["MultasPendientes"] == DBNull.Value ? 0 : Convert.ToInt32(dr["MultasPendientes"]),
                                MontoMultasPendientes = dr["MontoMultasPendientes"] == DBNull.Value ? 0 : Convert.ToDecimal(dr["MontoMultasPendientes"])
                            };
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en ObtenerEstadisticasUsuario: {ex.Message}");
                // En caso de error, devolver estadísticas vacías pero válidas
            }

            // Siempre devolver un objeto válido, incluso si no hay datos
            return new EstadisticasUsuarioDTO
            {
                TotalPrestamos = 0,
                PrestamosActivos = 0,
                PrestamosCompletados = 0,
                TotalMultas = 0,
                MultasPendientes = 0,
                MontoMultasPendientes = 0
            };
        }
    }
}
