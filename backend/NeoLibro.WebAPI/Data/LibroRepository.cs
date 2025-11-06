using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de Libros
    /// Maneja todas las operaciones de acceso a datos para libros
    /// </summary>
    public class LibroRepository : ILibroRepository
    {
        private readonly string _cadenaConexion;

        public LibroRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public List<LibroDTO> Listar()
        {
            var lista = new List<LibroDTO>();

            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT 
                        l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                        l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                        l.LCCCutter, l.SignaturaLCC,
                        COUNT(CASE WHEN e.EjemplarID IS NOT NULL AND (e.Estado != 'Baja' OR e.Estado IS NULL) THEN 1 END) as TotalEjemplares,
                        COUNT(CASE WHEN e.Estado = 'Disponible' THEN 1 END) as EjemplaresDisponibles,
                        COUNT(CASE WHEN e.Estado = 'Prestado' THEN 1 END) as EjemplaresPrestados
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID AND (e.Estado != 'Baja' OR e.Estado IS NULL)
                    GROUP BY l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                             l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                             l.LCCCutter, l.SignaturaLCC
                    ORDER BY l.Titulo", cn);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        var libro = new LibroDTO
                        {
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            ISBN = dr["ISBN"].ToString() ?? "",
                            Titulo = dr["Titulo"].ToString() ?? "",
                            Editorial = dr["Editorial"]?.ToString(),
                            AnioPublicacion = dr["AnioPublicacion"] != DBNull.Value ? Convert.ToInt32(dr["AnioPublicacion"]) : null,
                            Idioma = dr["Idioma"]?.ToString(),
                            Paginas = dr["Paginas"] != DBNull.Value ? Convert.ToInt32(dr["Paginas"]) : null,
                            LCCSeccion = dr["LCCSeccion"]?.ToString(),
                            LCCNumero = dr["LCCNumero"]?.ToString(),
                            LCCCutter = dr["LCCCutter"]?.ToString(),
                            SignaturaLCC = dr["SignaturaLCC"]?.ToString(),
                            TotalEjemplares = dr["TotalEjemplares"] == DBNull.Value ? 0 : Convert.ToInt32(dr["TotalEjemplares"]),
                            EjemplaresDisponibles = dr["EjemplaresDisponibles"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresDisponibles"]),
                            EjemplaresPrestados = dr["EjemplaresPrestados"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresPrestados"])
                        };

                        // Obtener autores
                        libro.Autores = ObtenerAutoresPorLibro(libro.LibroID);
                        
                        // Obtener categorías
                        libro.Categorias = ObtenerCategoriasPorLibro(libro.LibroID);

                        lista.Add(libro);
                    }
                }
            }

            return lista;
        }

        public LibroDTO? ObtenerPorId(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT 
                        l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                        l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                        l.LCCCutter, l.SignaturaLCC,
                        COUNT(CASE WHEN e.EjemplarID IS NOT NULL AND (e.Estado != 'Baja' OR e.Estado IS NULL) THEN 1 END) as TotalEjemplares,
                        COUNT(CASE WHEN e.Estado = 'Disponible' THEN 1 END) as EjemplaresDisponibles,
                        COUNT(CASE WHEN e.Estado = 'Prestado' THEN 1 END) as EjemplaresPrestados
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID AND (e.Estado != 'Baja' OR e.Estado IS NULL)
                    WHERE l.LibroID = @LibroID
                    GROUP BY l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                             l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                             l.LCCCutter, l.SignaturaLCC", cn);
                cmd.Parameters.AddWithValue("@LibroID", id);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        var libro = new LibroDTO
                        {
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            ISBN = dr["ISBN"].ToString() ?? "",
                            Titulo = dr["Titulo"].ToString() ?? "",
                            Editorial = dr["Editorial"]?.ToString(),
                            AnioPublicacion = dr["AnioPublicacion"] != DBNull.Value ? Convert.ToInt32(dr["AnioPublicacion"]) : null,
                            Idioma = dr["Idioma"]?.ToString(),
                            Paginas = dr["Paginas"] != DBNull.Value ? Convert.ToInt32(dr["Paginas"]) : null,
                            LCCSeccion = dr["LCCSeccion"]?.ToString(),
                            LCCNumero = dr["LCCNumero"]?.ToString(),
                            LCCCutter = dr["LCCCutter"]?.ToString(),
                            SignaturaLCC = dr["SignaturaLCC"]?.ToString(),
                            TotalEjemplares = dr["TotalEjemplares"] == DBNull.Value ? 0 : Convert.ToInt32(dr["TotalEjemplares"]),
                            EjemplaresDisponibles = dr["EjemplaresDisponibles"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresDisponibles"]),
                            EjemplaresPrestados = dr["EjemplaresPrestados"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresPrestados"])
                        };

                        // Obtener autores y categorías
                        libro.Autores = ObtenerAutoresPorLibro(libro.LibroID);
                        libro.Categorias = ObtenerCategoriasPorLibro(libro.LibroID);

                        return libro;
                    }
                }
            }

            return null;
        }

        public bool Crear(Libro obj)
        {
            using (SqlConnection cn = GetConnection())
            {
                cn.Open();
                using (var transaction = cn.BeginTransaction())
                {
                    try
                    {
                        // Insertar libro
                        SqlCommand cmd = new SqlCommand(@"
                            INSERT INTO Libros (ISBN, Titulo, Editorial, AnioPublicacion, Idioma, 
                                              Paginas, LCCSeccion, LCCNumero, LCCCutter)
                            VALUES (@ISBN, @Titulo, @Editorial, @AnioPublicacion, @Idioma, 
                                    @Paginas, @LCCSeccion, @LCCNumero, @LCCCutter);
                            SELECT SCOPE_IDENTITY();", cn, transaction);
                        
                        cmd.Parameters.AddWithValue("@ISBN", obj.ISBN);
                        cmd.Parameters.AddWithValue("@Titulo", obj.Titulo);
                        cmd.Parameters.AddWithValue("@Editorial", (object?)obj.Editorial ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@AnioPublicacion", (object?)obj.AnioPublicacion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Idioma", (object?)obj.Idioma ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Paginas", (object?)obj.Paginas ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCSeccion", (object?)obj.LCCSeccion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCNumero", (object?)obj.LCCNumero ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCCutter", (object?)obj.LCCCutter ?? DBNull.Value);

                        var libroId = Convert.ToInt32(cmd.ExecuteScalar());

                        // Insertar relaciones con autores
                        if (obj.Autores != null)
                        {
                            foreach (var autor in obj.Autores)
                            {
                                InsertarLibroAutor(cn, transaction, libroId, autor.AutorID);
                            }
                        }

                        // Insertar relaciones con categorías
                        if (obj.Categorias != null)
                        {
                            foreach (var categoria in obj.Categorias)
                            {
                                InsertarLibroCategoria(cn, transaction, libroId, categoria.CategoriaID);
                            }
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

        public bool Modificar(Libro obj)
        {
            using (SqlConnection cn = GetConnection())
            {
                cn.Open();
                using (var transaction = cn.BeginTransaction())
                {
                    try
                    {
                        // Actualizar libro
                        SqlCommand cmd = new SqlCommand(@"
                            UPDATE Libros 
                            SET ISBN = @ISBN, Titulo = @Titulo, Editorial = @Editorial,
                                AnioPublicacion = @AnioPublicacion, Idioma = @Idioma,
                                Paginas = @Paginas, LCCSeccion = @LCCSeccion,
                                LCCNumero = @LCCNumero, LCCCutter = @LCCCutter
                            WHERE LibroID = @LibroID", cn, transaction);
                        
                        cmd.Parameters.AddWithValue("@LibroID", obj.LibroID);
                        cmd.Parameters.AddWithValue("@ISBN", obj.ISBN);
                        cmd.Parameters.AddWithValue("@Titulo", obj.Titulo);
                        cmd.Parameters.AddWithValue("@Editorial", (object?)obj.Editorial ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@AnioPublicacion", (object?)obj.AnioPublicacion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Idioma", (object?)obj.Idioma ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@Paginas", (object?)obj.Paginas ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCSeccion", (object?)obj.LCCSeccion ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCNumero", (object?)obj.LCCNumero ?? DBNull.Value);
                        cmd.Parameters.AddWithValue("@LCCCutter", (object?)obj.LCCCutter ?? DBNull.Value);

                        cmd.ExecuteNonQuery();

                        // Eliminar relaciones existentes
                        EliminarRelacionesLibro(cn, transaction, obj.LibroID);

                        // Insertar nuevas relaciones
                        if (obj.Autores != null)
                        {
                            foreach (var autor in obj.Autores)
                            {
                                InsertarLibroAutor(cn, transaction, obj.LibroID, autor.AutorID);
                            }
                        }

                        if (obj.Categorias != null)
                        {
                            foreach (var categoria in obj.Categorias)
                            {
                                InsertarLibroCategoria(cn, transaction, obj.LibroID, categoria.CategoriaID);
                            }
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

        public bool Eliminar(int id)
        {
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    UPDATE Ejemplares 
                    SET Estado = 'Baja' 
                    WHERE LibroID = @LibroID", cn);
                cmd.Parameters.AddWithValue("@LibroID", id);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public List<LibroDTO> Buscar(string? autor, string? titulo)
        {
            var lista = new List<LibroDTO>();

            using (SqlConnection cn = GetConnection())
            {
                var whereClause = "WHERE 1=1";
                var parameters = new List<SqlParameter>();

                if (!string.IsNullOrEmpty(titulo))
                {
                    whereClause += " AND l.Titulo LIKE @Titulo";
                    parameters.Add(new SqlParameter("@Titulo", $"%{titulo}%"));
                }

                if (!string.IsNullOrEmpty(autor))
                {
                    whereClause += @" AND EXISTS (
                        SELECT 1 FROM LibroAutores la 
                        INNER JOIN Autores a ON la.AutorID = a.AutorID 
                        WHERE la.LibroID = l.LibroID AND a.Nombre LIKE @Autor)";
                    parameters.Add(new SqlParameter("@Autor", $"%{autor}%"));
                }

                SqlCommand cmd = new SqlCommand($@"
                    SELECT 
                        l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                        l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                        l.LCCCutter, l.SignaturaLCC,
                        COUNT(CASE WHEN e.EjemplarID IS NOT NULL AND (e.Estado != 'Baja' OR e.Estado IS NULL) THEN 1 END) as TotalEjemplares,
                        COUNT(CASE WHEN e.Estado = 'Disponible' THEN 1 END) as EjemplaresDisponibles,
                        COUNT(CASE WHEN e.Estado = 'Prestado' THEN 1 END) as EjemplaresPrestados
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID AND (e.Estado != 'Baja' OR e.Estado IS NULL)
                    {whereClause}
                    GROUP BY l.LibroID, l.ISBN, l.Titulo, l.Editorial, l.AnioPublicacion,
                             l.Idioma, l.Paginas, l.LCCSeccion, l.LCCSeccion, l.LCCNumero,
                             l.LCCCutter, l.SignaturaLCC
                    ORDER BY l.Titulo", cn);

                cmd.Parameters.AddRange(parameters.ToArray());
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        var libro = new LibroDTO
                        {
                            LibroID = Convert.ToInt32(dr["LibroID"]),
                            ISBN = dr["ISBN"].ToString() ?? "",
                            Titulo = dr["Titulo"].ToString() ?? "",
                            Editorial = dr["Editorial"]?.ToString(),
                            AnioPublicacion = dr["AnioPublicacion"] != DBNull.Value ? Convert.ToInt32(dr["AnioPublicacion"]) : null,
                            Idioma = dr["Idioma"]?.ToString(),
                            Paginas = dr["Paginas"] != DBNull.Value ? Convert.ToInt32(dr["Paginas"]) : null,
                            LCCSeccion = dr["LCCSeccion"]?.ToString(),
                            LCCNumero = dr["LCCNumero"]?.ToString(),
                            LCCCutter = dr["LCCCutter"]?.ToString(),
                            SignaturaLCC = dr["SignaturaLCC"]?.ToString(),
                            TotalEjemplares = dr["TotalEjemplares"] == DBNull.Value ? 0 : Convert.ToInt32(dr["TotalEjemplares"]),
                            EjemplaresDisponibles = dr["EjemplaresDisponibles"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresDisponibles"]),
                            EjemplaresPrestados = dr["EjemplaresPrestados"] == DBNull.Value ? 0 : Convert.ToInt32(dr["EjemplaresPrestados"])
                        };

                        libro.Autores = ObtenerAutoresPorLibro(libro.LibroID);
                        libro.Categorias = ObtenerCategoriasPorLibro(libro.LibroID);

                        lista.Add(libro);
                    }
                }
            }

            return lista;
        }

        // Métodos auxiliares
        public List<string> ObtenerAutoresPorLibro(int libroId)
        {
            var autores = new List<string>();
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT a.Nombre 
                    FROM Autores a
                    INNER JOIN LibroAutores la ON a.AutorID = la.AutorID
                    WHERE la.LibroID = @LibroID
                    ORDER BY la.OrdenAutor", cn);
                cmd.Parameters.AddWithValue("@LibroID", libroId);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        autores.Add(dr["Nombre"].ToString() ?? "");
                    }
                }
            }
            return autores;
        }

        public List<string> ObtenerCategoriasPorLibro(int libroId)
        {
            var categorias = new List<string>();
            using (SqlConnection cn = GetConnection())
            {
                SqlCommand cmd = new SqlCommand(@"
                    SELECT c.Nombre 
                    FROM Categorias c
                    INNER JOIN LibroCategorias lc ON c.CategoriaID = lc.CategoriaID
                    WHERE lc.LibroID = @LibroID", cn);
                cmd.Parameters.AddWithValue("@LibroID", libroId);
                cn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        categorias.Add(dr["Nombre"].ToString() ?? "");
                    }
                }
            }
            return categorias;
        }

        private void InsertarLibroAutor(SqlConnection cn, SqlTransaction transaction, int libroId, int autorId)
        {
            SqlCommand cmd = new SqlCommand(@"
                INSERT INTO LibroAutores (LibroID, AutorID, EsAutorPrincipal, OrdenAutor)
                VALUES (@LibroID, @AutorID, 0, 1)", cn, transaction);
            cmd.Parameters.AddWithValue("@LibroID", libroId);
            cmd.Parameters.AddWithValue("@AutorID", autorId);
            cmd.ExecuteNonQuery();
        }

        private void InsertarLibroCategoria(SqlConnection cn, SqlTransaction transaction, int libroId, int categoriaId)
        {
            SqlCommand cmd = new SqlCommand(@"
                INSERT INTO LibroCategorias (LibroID, CategoriaID, EsCategoriaPrincipal)
                VALUES (@LibroID, @CategoriaID, 0)", cn, transaction);
            cmd.Parameters.AddWithValue("@LibroID", libroId);
            cmd.Parameters.AddWithValue("@CategoriaID", categoriaId);
            cmd.ExecuteNonQuery();
        }

        private void EliminarRelacionesLibro(SqlConnection cn, SqlTransaction transaction, int libroId)
        {
            SqlCommand cmd1 = new SqlCommand("DELETE FROM LibroAutores WHERE LibroID = @LibroID", cn, transaction);
            cmd1.Parameters.AddWithValue("@LibroID", libroId);
            cmd1.ExecuteNonQuery();

            SqlCommand cmd2 = new SqlCommand("DELETE FROM LibroCategorias WHERE LibroID = @LibroID", cn, transaction);
            cmd2.Parameters.AddWithValue("@LibroID", libroId);
            cmd2.ExecuteNonQuery();
        }
    }
}
