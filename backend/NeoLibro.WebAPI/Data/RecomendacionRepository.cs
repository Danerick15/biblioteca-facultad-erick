using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Recomendaciones
    /// Maneja todas las operaciones de acceso a datos para recomendaciones
    /// </summary>
    public class RecomendacionRepository : IRecomendacionRepository
    {
        private readonly string _cadenaConexion;

        public RecomendacionRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<RecomendacionDTO> ListarPublicas()
        {
            var lista = new List<RecomendacionDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        r.RecomendacionID,
                        r.ProfesorID,
                        u.Nombre as NombreProfesor,
                        r.Curso,
                        r.LibroID,
                        l.Titulo as TituloLibro,
                        l.ISBN,
                        r.URLExterna,
                        r.Fecha
                    FROM Recomendaciones r
                    INNER JOIN Usuarios u ON r.ProfesorID = u.UsuarioID
                    LEFT JOIN Libros l ON r.LibroID = l.LibroID
                    ORDER BY r.Fecha DESC", cn);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new RecomendacionDTO
                        {
                            RecomendacionID = Convert.ToInt32(dr["RecomendacionID"]),
                            ProfesorID = Convert.ToInt32(dr["ProfesorID"]),
                            NombreProfesor = dr["NombreProfesor"].ToString() ?? "",
                            Curso = dr["Curso"].ToString() ?? "",
                            LibroID = dr["LibroID"] != DBNull.Value ? Convert.ToInt32(dr["LibroID"]) : null,
                            TituloLibro = dr["TituloLibro"]?.ToString(),
                            ISBN = dr["ISBN"]?.ToString(),
                            URLExterna = dr["URLExterna"]?.ToString(),
                            Fecha = Convert.ToDateTime(dr["Fecha"])
                        });
                    }
                }
            }

            return lista;
        }

        public List<RecomendacionDTO> ListarPorProfesor(int profesorID)
        {
            var lista = new List<RecomendacionDTO>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        r.RecomendacionID,
                        r.ProfesorID,
                        u.Nombre as NombreProfesor,
                        r.Curso,
                        r.LibroID,
                        l.Titulo as TituloLibro,
                        l.ISBN,
                        r.URLExterna,
                        r.Fecha
                    FROM Recomendaciones r
                    INNER JOIN Usuarios u ON r.ProfesorID = u.UsuarioID
                    LEFT JOIN Libros l ON r.LibroID = l.LibroID
                    WHERE r.ProfesorID = @ProfesorID
                    ORDER BY r.Fecha DESC", cn);
                cmd.Parameters.AddWithValue("@ProfesorID", profesorID);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new RecomendacionDTO
                        {
                            RecomendacionID = Convert.ToInt32(dr["RecomendacionID"]),
                            ProfesorID = Convert.ToInt32(dr["ProfesorID"]),
                            NombreProfesor = dr["NombreProfesor"].ToString() ?? "",
                            Curso = dr["Curso"].ToString() ?? "",
                            LibroID = dr["LibroID"] != DBNull.Value ? Convert.ToInt32(dr["LibroID"]) : null,
                            TituloLibro = dr["TituloLibro"]?.ToString(),
                            ISBN = dr["ISBN"]?.ToString(),
                            URLExterna = dr["URLExterna"]?.ToString(),
                            Fecha = Convert.ToDateTime(dr["Fecha"])
                        });
                    }
                }
            }

            return lista;
        }

        public RecomendacionDTO? ObtenerPorId(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 
                        r.RecomendacionID,
                        r.ProfesorID,
                        u.Nombre as NombreProfesor,
                        r.Curso,
                        r.LibroID,
                        l.Titulo as TituloLibro,
                        l.ISBN,
                        r.URLExterna,
                        r.Fecha
                    FROM Recomendaciones r
                    INNER JOIN Usuarios u ON r.ProfesorID = u.UsuarioID
                    LEFT JOIN Libros l ON r.LibroID = l.LibroID
                    WHERE r.RecomendacionID = @RecomendacionID", cn);
                cmd.Parameters.AddWithValue("@RecomendacionID", id);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new RecomendacionDTO
                        {
                            RecomendacionID = Convert.ToInt32(dr["RecomendacionID"]),
                            ProfesorID = Convert.ToInt32(dr["ProfesorID"]),
                            NombreProfesor = dr["NombreProfesor"].ToString() ?? "",
                            Curso = dr["Curso"].ToString() ?? "",
                            LibroID = dr["LibroID"] != DBNull.Value ? Convert.ToInt32(dr["LibroID"]) : null,
                            TituloLibro = dr["TituloLibro"]?.ToString(),
                            ISBN = dr["ISBN"]?.ToString(),
                            URLExterna = dr["URLExterna"]?.ToString(),
                            Fecha = Convert.ToDateTime(dr["Fecha"])
                        };
                    }
                }
            }

            return null;
        }

        public bool Crear(Recomendacion recomendacion)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    INSERT INTO Recomendaciones (ProfesorID, Curso, LibroID, URLExterna, Fecha)
                    VALUES (@ProfesorID, @Curso, @LibroID, @URLExterna, @Fecha)", cn);
                cmd.Parameters.AddWithValue("@ProfesorID", recomendacion.ProfesorID);
                cmd.Parameters.AddWithValue("@Curso", recomendacion.Curso);
                cmd.Parameters.AddWithValue("@LibroID", recomendacion.LibroID.HasValue ? (object)recomendacion.LibroID.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@URLExterna", recomendacion.URLExterna ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Fecha", recomendacion.Fecha);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Modificar(Recomendacion recomendacion)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE Recomendaciones 
                    SET Curso = @Curso, 
                        LibroID = @LibroID, 
                        URLExterna = @URLExterna
                    WHERE RecomendacionID = @RecomendacionID", cn);
                cmd.Parameters.AddWithValue("@RecomendacionID", recomendacion.RecomendacionID);
                cmd.Parameters.AddWithValue("@Curso", recomendacion.Curso);
                cmd.Parameters.AddWithValue("@LibroID", recomendacion.LibroID.HasValue ? (object)recomendacion.LibroID.Value : DBNull.Value);
                cmd.Parameters.AddWithValue("@URLExterna", recomendacion.URLExterna ?? (object)DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    DELETE FROM Recomendaciones 
                    WHERE RecomendacionID = @RecomendacionID", cn);
                cmd.Parameters.AddWithValue("@RecomendacionID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}


