using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Categorías
    /// Maneja todas las operaciones de acceso a datos para categorías
    /// </summary>
    public class CategoriaRepository : ICategoriaRepository
    {
        private readonly string _cadenaConexion;

        public CategoriaRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<Categoria> Listar()
        {
            var lista = new List<Categoria>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT CategoriaID, Nombre
                    FROM Categorias 
                    ORDER BY Nombre", cn);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Categoria
                        {
                            CategoriaID = Convert.ToInt32(dr["CategoriaID"]),
                            Nombre = dr["Nombre"].ToString() ?? ""
                        });
                    }
                }
            }

            return lista;
        }

        public Categoria? ObtenerPorId(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT CategoriaID, Nombre
                    FROM Categorias 
                    WHERE CategoriaID = @CategoriaID", cn);
                cmd.Parameters.AddWithValue("@CategoriaID", id);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Categoria
                        {
                            CategoriaID = Convert.ToInt32(dr["CategoriaID"]),
                            Nombre = dr["Nombre"].ToString() ?? ""
                        };
                    }
                }
            }

            return null;
        }

        public Categoria? ObtenerPorNombre(string nombre)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT CategoriaID, Nombre
                    FROM Categorias 
                    WHERE Nombre = @Nombre", cn);
                cmd.Parameters.AddWithValue("@Nombre", nombre);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new Categoria
                        {
                            CategoriaID = Convert.ToInt32(dr["CategoriaID"]),
                            Nombre = dr["Nombre"].ToString() ?? ""
                        };
                    }
                }
            }

            return null;
        }

        public bool Crear(Categoria categoria)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    INSERT INTO Categorias (Nombre)
                    VALUES (@Nombre)", cn);
                
                cmd.Parameters.AddWithValue("@Nombre", categoria.Nombre);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Modificar(Categoria categoria)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE Categorias 
                    SET Nombre = @Nombre
                    WHERE CategoriaID = @CategoriaID", cn);
                
                cmd.Parameters.AddWithValue("@CategoriaID", categoria.CategoriaID);
                cmd.Parameters.AddWithValue("@Nombre", categoria.Nombre);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Eliminar(int id)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    DELETE FROM Categorias 
                    WHERE CategoriaID = @CategoriaID 
                    AND NOT EXISTS (SELECT 1 FROM LibroCategorias WHERE CategoriaID = @CategoriaID)", cn);
                cmd.Parameters.AddWithValue("@CategoriaID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool TieneLibrosAsociados(int categoriaId)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT 1 FROM LibroCategorias 
                    WHERE CategoriaID = @CategoriaID", cn);
                cmd.Parameters.AddWithValue("@CategoriaID", categoriaId);
                
                cn.Open();
                return cmd.ExecuteScalar() != null;
            }
        }

        public List<Categoria> BuscarPorNombre(string termino)
        {
            var lista = new List<Categoria>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT CategoriaID, Nombre
                    FROM Categorias 
                    WHERE Nombre LIKE @Termino
                    ORDER BY Nombre", cn);
                cmd.Parameters.AddWithValue("@Termino", $"%{termino}%");
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new Categoria
                        {
                            CategoriaID = Convert.ToInt32(dr["CategoriaID"]),
                            Nombre = dr["Nombre"].ToString() ?? ""
                        });
                    }
                }
            }

            return lista;
        }
    }
}
