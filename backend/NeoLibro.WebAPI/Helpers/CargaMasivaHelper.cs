using OfficeOpenXml;
using System.Text;
using System.Globalization;

namespace NeoLibroAPI.Helpers
{
    /// <summary>
    /// Helper para procesar carga masiva de libros desde archivos CSV y Excel
    /// </summary>
    public static class CargaMasivaHelper
    {
        /// <summary>
        /// Representa una fila de datos de libro desde el archivo
        /// </summary>
        public class LibroFila
        {
            public int NumeroFila { get; set; }
            public string ISBN { get; set; } = string.Empty;
            public string Titulo { get; set; } = string.Empty;
            public string? Editorial { get; set; }
            public int? AnioPublicacion { get; set; }
            public string? Idioma { get; set; }
            public int? Paginas { get; set; }
            public string? LCCSeccion { get; set; }
            public string? LCCNumero { get; set; }
            public string? LCCCutter { get; set; }
            public string Autores { get; set; } = string.Empty; // Separados por punto y coma
            public string Categorias { get; set; } = string.Empty; // Separados por punto y coma
            public int CantidadEjemplares { get; set; } = 1; // Cantidad de ejemplares a crear
        }

        /// <summary>
        /// Resultado del procesamiento de una fila
        /// </summary>
        public class ResultadoFila
        {
            public int NumeroFila { get; set; }
            public bool Exitoso { get; set; }
            public string Mensaje { get; set; } = string.Empty;
            public LibroFila? Datos { get; set; }
        }

        /// <summary>
        /// Resultado completo de la carga masiva
        /// </summary>
        public class ResultadoCargaMasiva
        {
            public int TotalFilas { get; set; }
            public int Exitosas { get; set; }
            public int Fallidas { get; set; }
            public List<ResultadoFila> Resultados { get; set; } = new();
        }

        /// <summary>
        /// Procesa un archivo CSV o Excel y retorna las filas de libros
        /// </summary>
        public static List<LibroFila> LeerArchivo(Stream archivo, string nombreArchivo)
        {
            var extension = Path.GetExtension(nombreArchivo).ToLower();
            
            return extension switch
            {
                ".csv" => LeerCSV(archivo),
                ".xlsx" or ".xls" => LeerExcel(archivo),
                _ => throw new NotSupportedException($"Formato de archivo no soportado: {extension}. Use CSV o Excel (.xlsx, .xls)")
            };
        }

        /// <summary>
        /// Lee un archivo CSV
        /// </summary>
        private static List<LibroFila> LeerCSV(Stream archivo)
        {
            var libros = new List<LibroFila>();
            using var reader = new StreamReader(archivo, Encoding.UTF8);
            
            // Leer encabezados
            var encabezados = reader.ReadLine();
            if (encabezados == null)
                return libros;

            var columnas = ParsearLineaCSV(encabezados);
            var indiceColumna = CrearIndiceColumnas(columnas);

            int numeroFila = 1; // Empezar en 1 porque ya leímos los encabezados
            
            while (!reader.EndOfStream)
            {
                numeroFila++;
                var linea = reader.ReadLine();
                if (string.IsNullOrWhiteSpace(linea))
                    continue;

                var valores = ParsearLineaCSV(linea);
                if (valores.Count == 0)
                    continue;

                try
                {
                    var libro = MapearFilaAClase(valores, indiceColumna, numeroFila);
                    libros.Add(libro);
                }
                catch (Exception ex)
                {
                    // Continuar con la siguiente fila si hay error
                    Console.WriteLine($"Error procesando fila {numeroFila}: {ex.Message}");
                }
            }

            return libros;
        }

        /// <summary>
        /// Lee un archivo Excel
        /// </summary>
        private static List<LibroFila> LeerExcel(Stream archivo)
        {
            var libros = new List<LibroFila>();
            
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            using var package = new ExcelPackage(archivo);
            
            var worksheet = package.Workbook.Worksheets[0];
            if (worksheet == null)
                return libros;

            // Leer encabezados (primera fila)
            var encabezados = new List<string>();
            for (int col = 1; col <= worksheet.Dimension?.End.Column; col++)
            {
                var valor = worksheet.Cells[1, col].Value?.ToString() ?? "";
                encabezados.Add(valor);
            }

            var indiceColumna = CrearIndiceColumnas(encabezados);

            // Leer datos (empezar desde la fila 2)
            for (int fila = 2; fila <= worksheet.Dimension?.End.Row; fila++)
            {
                var valores = new List<string>();
                for (int col = 1; col <= worksheet.Dimension.End.Column; col++)
                {
                    var valor = worksheet.Cells[fila, col].Value?.ToString() ?? "";
                    valores.Add(valor);
                }

                if (valores.All(v => string.IsNullOrWhiteSpace(v)))
                    continue; // Fila vacía

                try
                {
                    var libro = MapearFilaAClase(valores, indiceColumna, fila);
                    libros.Add(libro);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error procesando fila {fila}: {ex.Message}");
                }
            }

            return libros;
        }

        /// <summary>
        /// Parsea una línea CSV considerando comillas y comas dentro de campos
        /// </summary>
        private static List<string> ParsearLineaCSV(string linea)
        {
            var valores = new List<string>();
            var valorActual = new StringBuilder();
            bool dentroComillas = false;

            foreach (char c in linea)
            {
                if (c == '"')
                {
                    dentroComillas = !dentroComillas;
                }
                else if (c == ',' && !dentroComillas)
                {
                    valores.Add(valorActual.ToString().Trim());
                    valorActual.Clear();
                }
                else
                {
                    valorActual.Append(c);
                }
            }
            
            valores.Add(valorActual.ToString().Trim());
            return valores;
        }

        /// <summary>
        /// Crea un índice de columnas basado en los encabezados
        /// </summary>
        private static Dictionary<string, int> CrearIndiceColumnas(List<string> encabezados)
        {
            var indice = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            
            for (int i = 0; i < encabezados.Count; i++)
            {
                var encabezado = encabezados[i].Trim();
                if (!string.IsNullOrEmpty(encabezado))
                {
                    indice[encabezado] = i;
                }
            }

            return indice;
        }

        /// <summary>
        /// Mapea una fila de valores a un objeto LibroFila
        /// </summary>
        private static LibroFila MapearFilaAClase(List<string> valores, Dictionary<string, int> indiceColumna, int numeroFila)
        {
            var libro = new LibroFila { NumeroFila = numeroFila };

            // Obtener valor de columna o string vacío si no existe
            Func<string, string> obtenerValor = (nombreColumna) =>
            {
                if (indiceColumna.TryGetValue(nombreColumna, out int indice) && indice < valores.Count)
                    return valores[indice].Trim();
                return string.Empty;
            };

            // Campos requeridos
            libro.ISBN = obtenerValor("ISBN") ?? obtenerValor("isbn") ?? "";
            libro.Titulo = obtenerValor("Titulo") ?? obtenerValor("Título") ?? obtenerValor("titulo") ?? "";

            // Campos opcionales
            libro.Editorial = obtenerValor("Editorial") ?? obtenerValor("editorial");
            libro.Idioma = obtenerValor("Idioma") ?? obtenerValor("idioma");
            libro.LCCSeccion = obtenerValor("LCCSeccion") ?? obtenerValor("LCC Sección") ?? obtenerValor("lccseccion");
            libro.LCCNumero = obtenerValor("LCCNumero") ?? obtenerValor("LCC Número") ?? obtenerValor("lccnumero");
            libro.LCCCutter = obtenerValor("LCCCutter") ?? obtenerValor("LCC Cutter") ?? obtenerValor("lcccutter");
            libro.Autores = obtenerValor("Autores") ?? obtenerValor("Autor") ?? obtenerValor("autores") ?? "";
            libro.Categorias = obtenerValor("Categorias") ?? obtenerValor("Categoría") ?? obtenerValor("Categoria") ?? obtenerValor("categorias") ?? "";

            // Campos numéricos
            var anioStr = obtenerValor("AñoPublicacion") ?? obtenerValor("Año Publicación") ?? obtenerValor("AnioPublicacion") ?? obtenerValor("anioPublicacion") ?? "";
            if (int.TryParse(anioStr, out int anio))
                libro.AnioPublicacion = anio;

            var paginasStr = obtenerValor("Paginas") ?? obtenerValor("Páginas") ?? obtenerValor("paginas") ?? "";
            if (int.TryParse(paginasStr, out int paginas))
                libro.Paginas = paginas;

            var cantidadStr = obtenerValor("CantidadEjemplares") ?? obtenerValor("Cantidad Ejemplares") ?? obtenerValor("cantidadEjemplares") ?? obtenerValor("Cantidad") ?? "";
            if (int.TryParse(cantidadStr, out int cantidad) && cantidad > 0)
                libro.CantidadEjemplares = cantidad;

            return libro;
        }

        /// <summary>
        /// Valida una fila de libro
        /// </summary>
        public static List<string> ValidarFila(LibroFila libro)
        {
            var errores = new List<string>();

            if (string.IsNullOrWhiteSpace(libro.ISBN))
                errores.Add("ISBN es requerido");

            if (string.IsNullOrWhiteSpace(libro.Titulo))
                errores.Add("Título es requerido");

            if (libro.AnioPublicacion.HasValue && (libro.AnioPublicacion < 1000 || libro.AnioPublicacion > DateTime.Now.Year + 1))
                errores.Add($"Año de publicación inválido: {libro.AnioPublicacion}");

            if (libro.Paginas.HasValue && libro.Paginas < 0)
                errores.Add("El número de páginas no puede ser negativo");

            if (libro.CantidadEjemplares < 1)
                errores.Add("La cantidad de ejemplares debe ser al menos 1");

            return errores;
        }
    }
}

