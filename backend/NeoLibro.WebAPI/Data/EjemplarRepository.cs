using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Ejemplares
    /// Maneja todas las operaciones de acceso a datos para ejemplares
    /// </summary>
    public class EjemplarRepository : IEjemplarRepository
    {
        private readonly string _cadenaConexion;

        public EjemplarRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<Ejemplar> Listar()
        {
            var lista = new List<Ejemplar>();

            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT EjemplarID, LibroID, NumeroEjemplar, CodigoBarras, 
                           Ubicacion, Estado, FechaAlta, Observaciones
                    FROM Ejemplares 
                    WHERE Estado != 'Baja'
                    ORDER BY LibroID, NumeroEjemplar", cn);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Ejemplar
                        {
                            EjemplarID = Convert.ToInt32(dr["EjemplarID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            Ubicacion = dr["Ubicacion"]?.ToString(),
                            Estado = dr["Estado"].ToString() ?? "",
                            FechaAlta = Convert.ToDateTime(dr["FechaAlta"]),
                            Observaciones = dr["Observaciones"]?.ToString()
                        });
                    }
                }
            }

            return lista;
        }

        public List<Ejemplar> ListarPorLibro(int libroId)
        {
            var lista = new List<Ejemplar>();

            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT EjemplarID, LibroID, NumeroEjemplar, CodigoBarras, 
                           Ubicacion, Estado, FechaAlta, Observaciones
                    FROM Ejemplares 
                    WHERE LibroID = @LibroID AND Estado != 'Baja'
                    ORDER BY NumeroEjemplar", cn);
                cmd.Parameters.AddWithValue("@LibroID", libroId);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Ejemplar
                        {
                            EjemplarID = Convert.ToInt32(dr["EjemplarID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            Ubicacion = dr["Ubicacion"]?.ToString(),
                            Estado = dr["Estado"].ToString() ?? "",
                            FechaAlta = Convert.ToDateTime(dr["FechaAlta"]),
                            Observaciones = dr["Observaciones"]?.ToString()
                        });
                    }
                }
            }

            return lista;
        }

        public Ejemplar? ObtenerPorId(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT EjemplarID, LibroID, NumeroEjemplar, CodigoBarras, 
                           Ubicacion, Estado, FechaAlta, Observaciones
                    FROM Ejemplares 
                    WHERE EjemplarID = @EjemplarID", cn);
                cmd.Parameters.AddWithValue("@EjemplarID", id);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Ejemplar
                        {
                            EjemplarID = Convert.ToInt32(dr["EjemplarID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            Ubicacion = dr["Ubicacion"]?.ToString(),
                            Estado = dr["Estado"].ToString() ?? "",
                            FechaAlta = Convert.ToDateTime(dr["FechaAlta"]),
                            Observaciones = dr["Observaciones"]?.ToString()
                        };
                    }
                }
            }

            return null;
        }

        public Ejemplar? ObtenerPorCodigoBarras(string codigoBarras)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT EjemplarID, LibroID, NumeroEjemplar, CodigoBarras, 
                           Ubicacion, Estado, FechaAlta, Observaciones
                    FROM Ejemplares 
                    WHERE CodigoBarras = @CodigoBarras", cn);
                cmd.Parameters.AddWithValue("@CodigoBarras", codigoBarras);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Ejemplar
                        {
                            EjemplarID = Convert.ToInt32(dr["EjemplarID"]),
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            NumeroEjemplar = Convert.ToInt32(dr["NumeroEjemplar"]),
                            CodigoBarras = dr["CodigoBarras"].ToString() ?? "",
                            Ubicacion = dr["Ubicacion"]?.ToString(),
                            Estado = dr["Estado"].ToString() ?? "",
                            FechaAlta = Convert.ToDateTime(dr["FechaAlta"]),
                            Observaciones = dr["Observaciones"]?.ToString()
                        };
                    }
                }
            }

            return null;
        }

        public bool Crear(Ejemplar obj)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    INSERT INTO Ejemplares (LibroID, NumeroEjemplar, CodigoBarras, 
                                          Ubicacion, Estado, FechaAlta, Observaciones)
                    VALUES (@LibroID, @NumeroEjemplar, @CodigoBarras, 
                            @Ubicacion, @Estado, @FechaAlta, @Observaciones)", cn);
                
                cmd.Parameters.AddWithValue("@LibroID", obj.LibroID);
                cmd.Parameters.AddWithValue("@NumeroEjemplar", obj.NumeroEjemplar);
                cmd.Parameters.AddWithValue("@CodigoBarras", obj.CodigoBarras);
                cmd.Parameters.AddWithValue("@Ubicacion", (object?)obj.Ubicacion ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Estado", obj.Estado);
                cmd.Parameters.AddWithValue("@FechaAlta", obj.FechaAlta);
                cmd.Parameters.AddWithValue("@Observaciones", (object?)obj.Observaciones ?? DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Modificar(Ejemplar obj)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    UPDATE Ejemplares 
                    SET LibroID = @LibroID, NumeroEjemplar = @NumeroEjemplar,
                        CodigoBarras = @CodigoBarras, Ubicacion = @Ubicacion,
                        Estado = @Estado, Observaciones = @Observaciones
                    WHERE EjemplarID = @EjemplarID", cn);
                
                cmd.Parameters.AddWithValue("@EjemplarID", obj.EjemplarID);
                cmd.Parameters.AddWithValue("@LibroID", obj.LibroID);
                cmd.Parameters.AddWithValue("@NumeroEjemplar", obj.NumeroEjemplar);
                cmd.Parameters.AddWithValue("@CodigoBarras", obj.CodigoBarras);
                cmd.Parameters.AddWithValue("@Ubicacion", (object?)obj.Ubicacion ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Estado", obj.Estado);
                cmd.Parameters.AddWithValue("@Observaciones", (object?)obj.Observaciones ?? DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    UPDATE Ejemplares 
                    SET Estado = 'Baja' 
                    WHERE EjemplarID = @EjemplarID", cn);
                cmd.Parameters.AddWithValue("@EjemplarID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public int ObtenerSiguienteNumeroEjemplar(int libroId)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT ISNULL(MAX(NumeroEjemplar), 0) + 1
                    FROM Ejemplares 
                    WHERE LibroID = @LibroID", cn);
                cmd.Parameters.AddWithValue("@LibroID", libroId);
                cn.Open();

                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        public bool ExisteCodigoBarras(string codigoBarras)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT 1 FROM Ejemplares 
                    WHERE CodigoBarras = @CodigoBarras", cn);
                cmd.Parameters.AddWithValue("@CodigoBarras", codigoBarras);
                cn.Open();

                return cmd.ExecuteScalar() != null;
            }
        }
    }
}
