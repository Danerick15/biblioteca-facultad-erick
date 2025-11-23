using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Models.DTOs;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Helpers;

namespace NeoLibroAPI.Business
{
    /// <summary>
    /// Implementación de la lógica de negocio para Libros
    /// Maneja todas las operaciones de lógica de negocio para libros
    /// </summary>
    public class LibroBusiness : ILibroBusiness
    {
        private readonly ILibroRepository _libroRepository;
        private readonly IAutorBusiness _autorBusiness;
        private readonly ICategoriaBusiness _categoriaBusiness;
        private readonly IEjemplarBusiness _ejemplarBusiness;

        public LibroBusiness(
            ILibroRepository libroRepository,
            IAutorBusiness autorBusiness,
            ICategoriaBusiness categoriaBusiness,
            IEjemplarBusiness ejemplarBusiness)
        {
            _libroRepository = libroRepository;
            _autorBusiness = autorBusiness;
            _categoriaBusiness = categoriaBusiness;
            _ejemplarBusiness = ejemplarBusiness;
        }

        public List<LibroDTO> Listar()
        {
            return _libroRepository.Listar();
        }

        public LibroDTO? ObtenerPorId(int id)
        {
            return _libroRepository.ObtenerPorId(id);
        }

        public bool Crear(Libro libro)
        {
            return _libroRepository.Crear(libro);
        }

        public bool Modificar(Libro libro)
        {
            return _libroRepository.Modificar(libro);
        }

        public bool Eliminar(int id)
        {
            return _libroRepository.Eliminar(id);
        }

        public List<LibroDTO> Buscar(string? autor, string? titulo, string? palabraClave)
        {
            return _libroRepository.Buscar(autor, titulo, palabraClave);
        }

        // Métodos para archivos digitales (HU-10)

        public bool ActualizarArchivoDigital(int libroID, string rutaArchivo, string tipoArchivo, long tamañoArchivo)
        {
            if (libroID <= 0 || string.IsNullOrEmpty(rutaArchivo) || string.IsNullOrEmpty(tipoArchivo) || tamañoArchivo <= 0)
                return false;

            return _libroRepository.ActualizarArchivoDigital(libroID, rutaArchivo, tipoArchivo, tamañoArchivo);
        }

        public bool EliminarArchivoDigital(int libroID)
        {
            if (libroID <= 0)
                return false;

            return _libroRepository.EliminarArchivoDigital(libroID);
        }

        public bool RegistrarAccesoDigital(int libroID, int usuarioID, string tipoAcceso, string? ipAcceso, string? userAgent)
        {
            if (libroID <= 0 || usuarioID <= 0 || string.IsNullOrEmpty(tipoAcceso))
                return false;

            // Registrar log de acceso
            var logRegistrado = _libroRepository.RegistrarLogAcceso(libroID, usuarioID, tipoAcceso, ipAcceso, userAgent);
            
            if (logRegistrado)
            {
                // Incrementar contador según el tipo de acceso
                if (tipoAcceso == "Vista")
                {
                    _libroRepository.IncrementarContadorVistas(libroID);
                }
                else if (tipoAcceso == "Descarga")
                {
                    _libroRepository.IncrementarContadorDescargas(libroID);
                }
            }

            return logRegistrado;
        }

        public string? ObtenerRutaArchivoDigital(int libroID)
        {
            if (libroID <= 0)
                return null;

            return _libroRepository.ObtenerRutaArchivoDigital(libroID);
        }

        public CargaMasivaHelper.ResultadoCargaMasiva ProcesarCargaMasiva(Stream archivo, string nombreArchivo)
        {
            var resultado = new CargaMasivaHelper.ResultadoCargaMasiva();

            try
            {
                // Leer archivo
                var filas = CargaMasivaHelper.LeerArchivo(archivo, nombreArchivo);
                resultado.TotalFilas = filas.Count;

                foreach (var fila in filas)
                {
                    var resultadoFila = new CargaMasivaHelper.ResultadoFila
                    {
                        NumeroFila = fila.NumeroFila,
                        Datos = fila
                    };

                    try
                    {
                        // Validar fila
                        var erroresValidacion = CargaMasivaHelper.ValidarFila(fila);
                        if (erroresValidacion.Any())
                        {
                            resultadoFila.Exitoso = false;
                            resultadoFila.Mensaje = string.Join("; ", erroresValidacion);
                            resultado.Fallidas++;
                            resultado.Resultados.Add(resultadoFila);
                            continue;
                        }

                        // Verificar si el libro ya existe por ISBN
                        var librosExistentes = _libroRepository.Listar();
                        var libroExistente = librosExistentes.FirstOrDefault(l => l.ISBN.Equals(fila.ISBN, StringComparison.OrdinalIgnoreCase));
                        
                        if (libroExistente != null)
                        {
                            resultadoFila.Exitoso = false;
                            resultadoFila.Mensaje = $"Libro con ISBN {fila.ISBN} ya existe";
                            resultado.Fallidas++;
                            resultado.Resultados.Add(resultadoFila);
                            continue;
                        }

                        // Procesar autores
                        var autoresIds = new List<int>();
                        if (!string.IsNullOrWhiteSpace(fila.Autores))
                        {
                            var nombresAutores = fila.Autores.Split(';', StringSplitOptions.RemoveEmptyEntries)
                                .Select(a => a.Trim())
                                .Where(a => !string.IsNullOrEmpty(a))
                                .ToList();

                            foreach (var nombreAutor in nombresAutores)
                            {
                                var autor = _autorBusiness.ObtenerPorNombre(nombreAutor);
                                if (autor == null)
                                {
                                    // Crear autor si no existe
                                    autor = new Autor { Nombre = nombreAutor };
                                    if (_autorBusiness.Crear(autor))
                                    {
                                        autor = _autorBusiness.ObtenerPorNombre(nombreAutor);
                                    }
                                }
                                
                                if (autor != null)
                                    autoresIds.Add(autor.AutorID);
                            }
                        }

                        // Procesar categorías
                        var categoriasIds = new List<int>();
                        if (!string.IsNullOrWhiteSpace(fila.Categorias))
                        {
                            var nombresCategorias = fila.Categorias.Split(';', StringSplitOptions.RemoveEmptyEntries)
                                .Select(c => c.Trim())
                                .Where(c => !string.IsNullOrEmpty(c))
                                .ToList();

                            foreach (var nombreCategoria in nombresCategorias)
                            {
                                var categoria = _categoriaBusiness.ObtenerPorNombre(nombreCategoria);
                                if (categoria == null)
                                {
                                    // Crear categoría si no existe
                                    categoria = new Categoria { Nombre = nombreCategoria };
                                    if (_categoriaBusiness.Crear(categoria))
                                    {
                                        categoria = _categoriaBusiness.ObtenerPorNombre(nombreCategoria);
                                    }
                                }
                                
                                if (categoria != null)
                                    categoriasIds.Add(categoria.CategoriaID);
                            }
                        }

                        // Crear libro
                        var libro = new Libro
                        {
                            ISBN = fila.ISBN,
                            Titulo = fila.Titulo,
                            Editorial = fila.Editorial,
                            AnioPublicacion = fila.AnioPublicacion,
                            Idioma = fila.Idioma,
                            Paginas = fila.Paginas,
                            LCCSeccion = fila.LCCSeccion,
                            LCCNumero = fila.LCCNumero,
                            LCCCutter = fila.LCCCutter,
                            Autores = autoresIds.Select(id => new Autor { AutorID = id }).ToList(),
                            Categorias = categoriasIds.Select(id => new Categoria { CategoriaID = id }).ToList()
                        };

                        if (!_libroRepository.Crear(libro))
                        {
                            resultadoFila.Exitoso = false;
                            resultadoFila.Mensaje = "Error al crear el libro en la base de datos";
                            resultado.Fallidas++;
                            resultado.Resultados.Add(resultadoFila);
                            continue;
                        }

                        // Buscar el libro recién creado por ISBN
                        var libros = _libroRepository.Listar();
                        var libroCreado = libros.FirstOrDefault(l => 
                            l.ISBN.Equals(fila.ISBN, StringComparison.OrdinalIgnoreCase) &&
                            l.Titulo.Equals(fila.Titulo, StringComparison.OrdinalIgnoreCase));

                        if (libroCreado == null)
                        {
                            resultadoFila.Exitoso = false;
                            resultadoFila.Mensaje = "Error al obtener el libro creado";
                            resultado.Fallidas++;
                            resultado.Resultados.Add(resultadoFila);
                            continue;
                        }

                        // Crear ejemplares
                        int ejemplaresCreados = 0;
                        for (int i = 0; i < fila.CantidadEjemplares; i++)
                        {
                            var ejemplar = new Ejemplar
                            {
                                LibroID = libroCreado.LibroID,
                                CodigoBarras = $"{fila.ISBN}-{i + 1:D3}",
                                Estado = "Disponible",
                                FechaAlta = DateTime.Now
                            };

                            if (_ejemplarBusiness.Crear(ejemplar))
                            {
                                ejemplaresCreados++;
                            }
                        }

                        resultadoFila.Exitoso = true;
                        resultadoFila.Mensaje = $"Libro creado exitosamente con {ejemplaresCreados} ejemplar(es)";
                        resultado.Exitosas++;
                        resultado.Resultados.Add(resultadoFila);
                    }
                    catch (Exception ex)
                    {
                        resultadoFila.Exitoso = false;
                        resultadoFila.Mensaje = $"Error: {ex.Message}";
                        resultado.Fallidas++;
                        resultado.Resultados.Add(resultadoFila);
                    }
                }
            }
            catch (Exception ex)
            {
                resultado.Fallidas = resultado.TotalFilas;
                resultado.Exitosas = 0;
                resultado.Resultados.Add(new CargaMasivaHelper.ResultadoFila
                {
                    NumeroFila = 0,
                    Exitoso = false,
                    Mensaje = $"Error al procesar el archivo: {ex.Message}"
                });
            }

            return resultado;
        }
    }
}
