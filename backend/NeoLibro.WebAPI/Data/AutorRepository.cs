using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Autores
    /// Maneja todas las operaciones de acceso a datos para autores
    /// </summary>
    public class AutorRepository : IAutorRepository
    {
        private readonly string _cadenaConexion;

        public AutorRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<Autor> Listar()
        {
            var lista = new List<Autor>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT AutorID, Nombre, Biografia, ORCID
                    FROM Autores 
                    ORDER BY Nombre", cn);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Autor
                        {
                            AutorID = Convert.ToInt32(dr["AutorID"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Biografia = dr["Biografia"]?.ToString(),
                            ORCID = dr["ORCID"]?.ToString()
                        });
                    }
                }
            }

            return lista;
        }

        public Autor? ObtenerPorId(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT AutorID, Nombre, Biografia, ORCID
                    FROM Autores 
                    WHERE AutorID = @AutorID", cn);
                cmd.Parameters.AddWithValue("@AutorID", id);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Autor
                        {
                            AutorID = Convert.ToInt32(dr["AutorID"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Biografia = dr["Biografia"]?.ToString(),
                            ORCID = dr["ORCID"]?.ToString()
                        };
                    }
                }
            }

            return null;
        }

        public Autor? ObtenerPorNombre(string nombre)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT AutorID, Nombre, Biografia, ORCID
                    FROM Autores 
                    WHERE Nombre = @Nombre", cn);
                cmd.Parameters.AddWithValue("@Nombre", nombre);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Autor
                        {
                            AutorID = Convert.ToInt32(dr["AutorID"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Biografia = dr["Biografia"]?.ToString(),
                            ORCID = dr["ORCID"]?.ToString()
                        };
                    }
                }
            }

            return null;
        }

        public bool Crear(Autor autor)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    INSERT INTO Autores (Nombre, Biografia, ORCID)
                    VALUES (@Nombre, @Biografia, @ORCID)", cn);
                
                cmd.Parameters.AddWithValue("@Nombre", autor.Nombre);
                cmd.Parameters.AddWithValue("@Biografia", (object?)autor.Biografia ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ORCID", (object?)autor.ORCID ?? DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Modificar(Autor autor)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE Autores 
                    SET Nombre = @Nombre, Biografia = @Biografia, ORCID = @ORCID
                    WHERE AutorID = @AutorID", cn);
                
                cmd.Parameters.AddWithValue("@AutorID", autor.AutorID);
                cmd.Parameters.AddWithValue("@Nombre", autor.Nombre);
                cmd.Parameters.AddWithValue("@Biografia", (object?)autor.Biografia ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ORCID", (object?)autor.ORCID ?? DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    DELETE FROM Autores 
                    WHERE AutorID = @AutorID 
                    AND NOT EXISTS (SELECT 1 FROM LibroAutores WHERE AutorID = @AutorID)", cn);
                cmd.Parameters.AddWithValue("@AutorID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool TieneLibrosAsociados(int autorId)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 1 FROM LibroAutores 
                    WHERE AutorID = @AutorID", cn);
                cmd.Parameters.AddWithValue("@AutorID", autorId);
                
                cn.Open();
                return cmd.ExecuteScalar() != null;
            }
        }

        public List<Autor> BuscarPorNombre(string termino)
        {
            var lista = new List<Autor>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT AutorID, Nombre, Biografia, ORCID
                    FROM Autores 
                    WHERE Nombre LIKE @Termino
                    ORDER BY Nombre", cn);
                cmd.Parameters.AddWithValue("@Termino", $"%{termino}%");
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Autor
                        {
                            AutorID = Convert.ToInt32(dr["AutorID"]),
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Biografia = dr["Biografia"]?.ToString(),
                            ORCID = dr["ORCID"]?.ToString()
                        });
                    }
                }
            }

            return lista;
        }
    }
}
