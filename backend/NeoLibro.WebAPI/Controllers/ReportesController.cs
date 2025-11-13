using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Models.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using OfficeOpenXml;
using System.Text;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace NeoLibroAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class ReportesController : ControllerBase
    {
        private readonly IUsuarioBusiness _usuarioBusiness;
        private readonly ILibroBusiness _libroBusiness;
        private readonly IEjemplarBusiness _ejemplarBusiness;
        private readonly IPrestamoBusiness _prestamoBusiness;
        private readonly IMultaBusiness _multaBusiness;
        private readonly IConfiguration _configuration;

        public ReportesController(
            IUsuarioBusiness usuarioBusiness,
            ILibroBusiness libroBusiness,
            IEjemplarBusiness ejemplarBusiness,
            IPrestamoBusiness prestamoBusiness,
            IMultaBusiness multaBusiness,
            IConfiguration configuration)
        {
            _usuarioBusiness = usuarioBusiness;
            _libroBusiness = libroBusiness;
            _ejemplarBusiness = ejemplarBusiness;
            _prestamoBusiness = prestamoBusiness;
            _multaBusiness = multaBusiness;
            _configuration = configuration;
        }

        // GET: api/Reportes/estadisticas-generales
        [HttpGet("estadisticas-generales")]
        public IActionResult ObtenerEstadisticasGenerales()
        {
            try
            {
                var usuarios = _usuarioBusiness?.Listar() ?? new List<NeoLibroAPI.Models.Entities.Usuario>();
                var libros = _libroBusiness?.Listar() ?? new List<NeoLibroAPI.Models.DTOs.LibroDTO>();
                var ejemplares = _ejemplarBusiness?.Listar() ?? new List<NeoLibroAPI.Models.Entities.Ejemplar>();
                var prestamos = _prestamoBusiness?.ListarPrestamosActivos() ?? new List<NeoLibroAPI.Models.DTOs.PrestamoDTO>();
                var multas = _multaBusiness?.ListarMultasPendientes() ?? new List<NeoLibroAPI.Models.Entities.Multa>();

                // Contar préstamos vencidos (estado "Atrasado" o que tengan FechaVencimiento pasada)
                var prestamosVencidos = prestamos != null 
                    ? prestamos.Count(p => 
                        (p.Estado == "Atrasado" || p.Estado == "ATRASADO") || 
                        (p.EstadoCalculado != null && p.EstadoCalculado == "Atrasado") ||
                        (p.Estado == "Prestado" && p.FechaVencimiento < DateTime.Now))
                    : 0;

                // Calcular monto total de multas de forma segura
                var montoTotalMultas = multas != null && multas.Any() 
                    ? multas.Sum(m => m.Monto) 
                    : 0;

                var estadisticas = new
                {
                    totalUsuarios = usuarios?.Count ?? 0,
                    totalLibros = libros?.Count ?? 0,
                    totalEjemplares = ejemplares?.Count ?? 0,
                    prestamosActivos = prestamos?.Count ?? 0,
                    prestamosVencidos = prestamosVencidos,
                    multasPendientes = multas?.Count ?? 0,
                    montoTotalMultas = montoTotalMultas
                };

                return Ok(estadisticas);
            }
            catch (Exception ex)
            {
                // Log del error completo para debugging
                Console.WriteLine($"Error en ObtenerEstadisticasGenerales: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas", error = ex.Message });
            }
        }

        // GET: api/Reportes/prestamos-por-mes
        [HttpGet("prestamos-por-mes")]
        public IActionResult ObtenerPrestamosPorMes([FromQuery] int año = 0)
        {
            try
            {
                if (año == 0) año = DateTime.Now.Year;

                var prestamos = _prestamoBusiness.ListarPrestamosActivos()
                    .Where(p => p.FechaPrestamo.Year == año)
                    .ToList();

                var prestamosPorMes = new List<object>();
                var meses = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                                  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };

                for (int i = 1; i <= 12; i++)
                {
                    var cantidad = prestamos.Count(p => p.FechaPrestamo.Month == i);
                    prestamosPorMes.Add(new
                    {
                        mes = meses[i - 1],
                        cantidad = cantidad
                    });
                }

                return Ok(prestamosPorMes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener préstamos por mes", error = ex.Message });
            }
        }

        // GET: api/Reportes/libros-mas-prestados
        [HttpGet("libros-mas-prestados")]
        public IActionResult ObtenerLibrosMasPrestados([FromQuery] int limite = 10)
        {
            try
            {
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var libros = _libroBusiness.Listar();

                var librosMasPrestados = prestamos
                    .GroupBy(p => p.LibroTitulo)
                    .Select(g => new
                    {
                        titulo = g.Key,
                        prestamos = g.Count()
                    })
                    .OrderByDescending(x => x.prestamos)
                    .Take(limite)
                    .ToList();

                return Ok(librosMasPrestados);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener libros más prestados", error = ex.Message });
            }
        }

        // GET: api/Reportes/usuarios-mas-activos
        [HttpGet("usuarios-mas-activos")]
        public IActionResult ObtenerUsuariosMasActivos([FromQuery] int limite = 10)
        {
            try
            {
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var usuarios = _usuarioBusiness.Listar();

                var usuariosMasActivos = prestamos
                    .GroupBy(p => p.UsuarioNombre)
                    .Select(g => new
                    {
                        nombre = g.Key,
                        prestamos = g.Count()
                    })
                    .OrderByDescending(x => x.prestamos)
                    .Take(limite)
                    .ToList();

                return Ok(usuariosMasActivos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener usuarios más activos", error = ex.Message });
            }
        }

        // GET: api/Reportes/estadisticas-por-rol
        [HttpGet("estadisticas-por-rol")]
        public IActionResult ObtenerEstadisticasPorRol()
        {
            try
            {
                var usuarios = _usuarioBusiness.Listar();

                var estadisticasPorRol = usuarios
                    .GroupBy(u => u.Rol)
                    .Select(g => new
                    {
                        rol = g.Key,
                        cantidad = g.Count()
                    })
                    .ToList();

                return Ok(estadisticasPorRol);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas por rol", error = ex.Message });
            }
        }

        // GET: api/Reportes/actividad-diaria
        [HttpGet("actividad-diaria")]
        public IActionResult ObtenerActividadDiaria([FromQuery] DateTime? fecha = null)
        {
            try
            {
                var fechaConsulta = fecha ?? DateTime.Today;
                var prestamos = _prestamoBusiness.ListarPrestamosActivos();
                var multas = _multaBusiness.ListarMultasPendientes();

                var actividad = new
                {
                    fecha = fechaConsulta.ToString("yyyy-MM-dd"),
                    prestamosHoy = prestamos.Count(p => p.FechaPrestamo.Date == fechaConsulta),
                    devolucionesHoy = prestamos.Count(p => p.FechaDevolucion?.Date == fechaConsulta),
                    multasGeneradasHoy = multas.Count(m => m.FechaCobro?.Date == fechaConsulta),
                    multasPagadasHoy = multas.Count(m => m.Estado == "Pagada")
                };

                return Ok(actividad);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener actividad diaria", error = ex.Message });
            }
        }

        // GET: api/Reportes/rendimiento-biblioteca
        [HttpGet("rendimiento-biblioteca")]
        public IActionResult ObtenerRendimientoBiblioteca([FromQuery] int meses = 6)
        {
            try
            {
                var rendimientoData = ObtenerDatosRendimientoBiblioteca(meses);
                
                var rendimiento = new
                {
                    periodo = rendimientoData.periodo,
                    fechaInicio = rendimientoData.fechaInicio,
                    fechaFin = rendimientoData.fechaFin,
                    totalPrestamos = rendimientoData.totalPrestamos,
                    prestamosCompletados = rendimientoData.prestamosCompletados,
                    prestamosVencidos = rendimientoData.prestamosVencidos,
                    tasaDevolucion = rendimientoData.tasaDevolucion,
                    totalMultas = rendimientoData.totalMultas,
                    montoTotalMultas = rendimientoData.montoTotalMultas,
                    multasPagadas = rendimientoData.multasPagadas,
                    tasaPagoMultas = rendimientoData.tasaPagoMultas
                };

                return Ok(rendimiento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener rendimiento de biblioteca", error = ex.Message });
            }
        }

        // GET: api/Reportes/exportar
        [HttpGet("exportar")]
        public IActionResult ExportarReporte([FromQuery] string formato = "pdf", [FromQuery] string tipoReporte = "general")
        {
            try
            {
                if (formato.ToLower() == "pdf")
                {
                    var pdfBytes = GenerarPDFCompleto();
                    var nombreArchivo = $"Reporte_Biblioteca_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                    return File(pdfBytes, "application/pdf", nombreArchivo);
                }
                else if (formato.ToLower() == "excel")
                {
                    var excelBytes = GenerarExcelCompleto();
                    var nombreArchivo = $"Reporte_Biblioteca_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                    return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nombreArchivo);
                }
                else
                {
                    return BadRequest(new { mensaje = "Formato no soportado. Use 'pdf' o 'excel'" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al exportar reporte: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { mensaje = "Error al generar el archivo de exportación", error = ex.Message });
            }
        }

        private byte[] GenerarPDFCompleto()
        {
            try
            {
                QuestPDF.Settings.License = LicenseType.Community;
                
                // Obtener todos los datos
                var estadisticas = ObtenerDatosEstadisticasGenerales();
                var prestamosPorMes = ObtenerDatosPrestamosPorMes();
                var librosMasPrestados = ObtenerDatosLibrosMasPrestados(10);
                var usuariosMasActivos = ObtenerDatosUsuariosMasActivos(10);
                var estadisticasPorRol = ObtenerDatosEstadisticasPorRol();
                var actividadDiaria = ObtenerDatosActividadDiaria();
                var rendimiento = ObtenerDatosRendimientoBiblioteca(6);

            var pdfDocument = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header()
                        .AlignCenter()
                        .Text("REPORTE DE BIBLIOTECA FISI")
                        .FontSize(20)
                        .Bold()
                        .FontColor(Colors.Blue.Darken3);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(1, Unit.Centimetre);

                            // Estadísticas Generales
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("ESTADÍSTICAS GENERALES").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Cell().Element(CellStyle).Text("Total Usuarios:");
                                table.Cell().Element(CellStyle).Text(estadisticas.totalUsuarios.ToString());
                                table.Cell().Element(CellStyle).Text("Total Libros:");
                                table.Cell().Element(CellStyle).Text(estadisticas.totalLibros.ToString());
                                table.Cell().Element(CellStyle).Text("Total Ejemplares:");
                                table.Cell().Element(CellStyle).Text(estadisticas.totalEjemplares.ToString());
                                table.Cell().Element(CellStyle).Text("Préstamos Activos:");
                                table.Cell().Element(CellStyle).Text(estadisticas.prestamosActivos.ToString());
                                table.Cell().Element(CellStyle).Text("Préstamos Vencidos:");
                                table.Cell().Element(CellStyle).Text(estadisticas.prestamosVencidos.ToString());
                                table.Cell().Element(CellStyle).Text("Multas Pendientes:");
                                table.Cell().Element(CellStyle).Text(estadisticas.multasPendientes.ToString());
                                table.Cell().Element(CellStyle).Text("Monto Total Multas:");
                                table.Cell().Element(CellStyle).Text($"S/ {estadisticas.montoTotalMultas:F2}");
                            });

                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Préstamos por Mes
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("PRÉSTAMOS POR MES").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                foreach (var item in prestamosPorMes)
                                {
                                    table.Cell().Element(CellStyle).Text(item.mes);
                                    table.Cell().Element(CellStyle).Text(item.cantidad.ToString());
                                }
                            });

                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Libros Más Prestados
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("LIBROS MÁS PRESTADOS").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(2);
                                    columns.RelativeColumn();
                                });

                                foreach (var libro in librosMasPrestados)
                                {
                                    table.Cell().Element(CellStyle).Text(libro.titulo);
                                    table.Cell().Element(CellStyle).Text(libro.prestamos.ToString());
                                }
                            });

                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Usuarios Más Activos
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("USUARIOS MÁS ACTIVOS").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(2);
                                    columns.RelativeColumn();
                                });

                                foreach (var usuario in usuariosMasActivos)
                                {
                                    table.Cell().Element(CellStyle).Text(usuario.nombre);
                                    table.Cell().Element(CellStyle).Text(usuario.prestamos.ToString());
                                }
                            });

                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Estadísticas por Rol
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("ESTADÍSTICAS POR ROL").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                foreach (var rol in estadisticasPorRol)
                                {
                                    table.Cell().Element(CellStyle).Text(rol.rol);
                                    table.Cell().Element(CellStyle).Text(rol.cantidad.ToString());
                                }
                            });

                            column.Item().PaddingTop(0.5f, Unit.Centimetre);

                            // Rendimiento
                            column.Item().PaddingBottom(0.5f, Unit.Centimetre).Text("RENDIMIENTO DE BIBLIOTECA").FontSize(14).Bold();
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Cell().Element(CellStyle).Text("Período:");
                                table.Cell().Element(CellStyle).Text(rendimiento.periodo);
                                table.Cell().Element(CellStyle).Text("Total Préstamos:");
                                table.Cell().Element(CellStyle).Text(rendimiento.totalPrestamos.ToString());
                                table.Cell().Element(CellStyle).Text("Préstamos Completados:");
                                table.Cell().Element(CellStyle).Text(rendimiento.prestamosCompletados.ToString());
                                table.Cell().Element(CellStyle).Text("Tasa de Devolución:");
                                table.Cell().Element(CellStyle).Text($"{rendimiento.tasaDevolucion:F2}%");
                                table.Cell().Element(CellStyle).Text("Monto Total Multas:");
                                table.Cell().Element(CellStyle).Text($"S/ {rendimiento.montoTotalMultas:F2}");
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .DefaultTextStyle(TextStyle.Default.FontSize(8).FontColor(Colors.Grey.Medium))
                        .Text(x =>
                        {
                            x.Span("Generado el ");
                            x.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")).Bold();
                        });
                });
            });

                return pdfDocument.GeneratePdf();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en GenerarPDFCompleto: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        private static IContainer CellStyle(IContainer container)
        {
            return container
                .BorderBottom(1)
                .BorderColor(Colors.Grey.Lighten2)
                .PaddingVertical(5)
                .PaddingHorizontal(10);
        }

        private byte[] GenerarExcelCompleto()
        {
            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                
                using var package = new ExcelPackage();
                
                // Obtener todos los datos
                var estadisticas = ObtenerDatosEstadisticasGenerales();
                var prestamosPorMes = ObtenerDatosPrestamosPorMes();
                var librosMasPrestados = ObtenerDatosLibrosMasPrestados(10);
                var usuariosMasActivos = ObtenerDatosUsuariosMasActivos(10);
                var estadisticasPorRol = ObtenerDatosEstadisticasPorRol();
                var actividadDiaria = ObtenerDatosActividadDiaria();
                var rendimiento = ObtenerDatosRendimientoBiblioteca(6);

            // Hoja 1: Estadísticas Generales
            var ws1 = package.Workbook.Worksheets.Add("Estadísticas Generales");
            ws1.Cells[1, 1].Value = "REPORTE DE BIBLIOTECA FISI";
            ws1.Cells[1, 1, 1, 2].Merge = true;
            ws1.Cells[1, 1].Style.Font.Size = 16;
            ws1.Cells[1, 1].Style.Font.Bold = true;
            ws1.Cells[1, 1].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

            int row = 3;
            ws1.Cells[row, 1].Value = "Total Usuarios";
            ws1.Cells[row, 2].Value = estadisticas.totalUsuarios;
            row++;
            ws1.Cells[row, 1].Value = "Total Libros";
            ws1.Cells[row, 2].Value = estadisticas.totalLibros;
            row++;
            ws1.Cells[row, 1].Value = "Total Ejemplares";
            ws1.Cells[row, 2].Value = estadisticas.totalEjemplares;
            row++;
            ws1.Cells[row, 1].Value = "Préstamos Activos";
            ws1.Cells[row, 2].Value = estadisticas.prestamosActivos;
            row++;
            ws1.Cells[row, 1].Value = "Préstamos Vencidos";
            ws1.Cells[row, 2].Value = estadisticas.prestamosVencidos;
            row++;
            ws1.Cells[row, 1].Value = "Multas Pendientes";
            ws1.Cells[row, 2].Value = estadisticas.multasPendientes;
            row++;
            ws1.Cells[row, 1].Value = "Monto Total Multas";
            ws1.Cells[row, 2].Value = estadisticas.montoTotalMultas;
            ws1.Cells[row, 2].Style.Numberformat.Format = "#,##0.00";

            // Hoja 2: Préstamos por Mes
            var ws2 = package.Workbook.Worksheets.Add("Préstamos por Mes");
            ws2.Cells[1, 1].Value = "Mes";
            ws2.Cells[1, 2].Value = "Cantidad";
            ws2.Cells[1, 1, 1, 2].Style.Font.Bold = true;
            row = 2;
            foreach (var item in prestamosPorMes)
            {
                ws2.Cells[row, 1].Value = item.mes;
                ws2.Cells[row, 2].Value = item.cantidad;
                row++;
            }

            // Hoja 3: Libros Más Prestados
            var ws3 = package.Workbook.Worksheets.Add("Libros Más Prestados");
            ws3.Cells[1, 1].Value = "Título";
            ws3.Cells[1, 2].Value = "Préstamos";
            ws3.Cells[1, 1, 1, 2].Style.Font.Bold = true;
            row = 2;
            foreach (var libro in librosMasPrestados)
            {
                ws3.Cells[row, 1].Value = libro.titulo;
                ws3.Cells[row, 2].Value = libro.prestamos;
                row++;
            }

            // Hoja 4: Usuarios Más Activos
            var ws4 = package.Workbook.Worksheets.Add("Usuarios Más Activos");
            ws4.Cells[1, 1].Value = "Nombre";
            ws4.Cells[1, 2].Value = "Préstamos";
            ws4.Cells[1, 1, 1, 2].Style.Font.Bold = true;
            row = 2;
            foreach (var usuario in usuariosMasActivos)
            {
                ws4.Cells[row, 1].Value = usuario.nombre;
                ws4.Cells[row, 2].Value = usuario.prestamos;
                row++;
            }

            // Hoja 5: Estadísticas por Rol
            var ws5 = package.Workbook.Worksheets.Add("Estadísticas por Rol");
            ws5.Cells[1, 1].Value = "Rol";
            ws5.Cells[1, 2].Value = "Cantidad";
            ws5.Cells[1, 1, 1, 2].Style.Font.Bold = true;
            row = 2;
            foreach (var rol in estadisticasPorRol)
            {
                ws5.Cells[row, 1].Value = rol.rol;
                ws5.Cells[row, 2].Value = rol.cantidad;
                row++;
            }

            // Hoja 6: Rendimiento
            var ws6 = package.Workbook.Worksheets.Add("Rendimiento");
            row = 1;
            ws6.Cells[row, 1].Value = "Período";
            ws6.Cells[row, 2].Value = rendimiento.periodo;
            row++;
            ws6.Cells[row, 1].Value = "Total Préstamos";
            ws6.Cells[row, 2].Value = rendimiento.totalPrestamos;
            row++;
            ws6.Cells[row, 1].Value = "Préstamos Completados";
            ws6.Cells[row, 2].Value = rendimiento.prestamosCompletados;
            row++;
            ws6.Cells[row, 1].Value = "Tasa de Devolución";
            ws6.Cells[row, 2].Value = rendimiento.tasaDevolucion / 100.0; // Convertir porcentaje a decimal
            ws6.Cells[row, 2].Style.Numberformat.Format = "0.00%";
            row++;
            ws6.Cells[row, 1].Value = "Monto Total Multas";
            ws6.Cells[row, 2].Value = rendimiento.montoTotalMultas;
            ws6.Cells[row, 2].Style.Numberformat.Format = "#,##0.00";

                // Ajustar ancho de columnas
                foreach (var ws in package.Workbook.Worksheets)
                {
                    if (ws.Dimension != null)
                    {
                        ws.Cells[ws.Dimension.Address].AutoFitColumns();
                    }
                }

                return package.GetAsByteArray();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en GenerarExcelCompleto: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // Clases auxiliares para los datos
        private class EstadisticasGeneralesData
        {
            public int totalUsuarios { get; set; }
            public int totalLibros { get; set; }
            public int totalEjemplares { get; set; }
            public int prestamosActivos { get; set; }
            public int prestamosVencidos { get; set; }
            public int multasPendientes { get; set; }
            public decimal montoTotalMultas { get; set; }
        }

        private class PrestamoPorMesData
        {
            public string mes { get; set; } = string.Empty;
            public int cantidad { get; set; }
        }

        private class LibroMasPrestadoData
        {
            public string titulo { get; set; } = string.Empty;
            public int prestamos { get; set; }
        }

        private class UsuarioMasActivoData
        {
            public string nombre { get; set; } = string.Empty;
            public int prestamos { get; set; }
        }

        private class EstadisticaPorRolData
        {
            public string rol { get; set; } = string.Empty;
            public int cantidad { get; set; }
        }

        private class RendimientoData
        {
            public string periodo { get; set; } = string.Empty;
            public string fechaInicio { get; set; } = string.Empty;
            public string fechaFin { get; set; } = string.Empty;
            public int totalPrestamos { get; set; }
            public int prestamosCompletados { get; set; }
            public int prestamosVencidos { get; set; }
            public double tasaDevolucion { get; set; }
            public int totalMultas { get; set; }
            public decimal montoTotalMultas { get; set; }
            public int multasPagadas { get; set; }
            public double tasaPagoMultas { get; set; }
        }

        // Métodos auxiliares para obtener datos
        private EstadisticasGeneralesData ObtenerDatosEstadisticasGenerales()
        {
            var usuarios = _usuarioBusiness?.Listar() ?? new List<NeoLibroAPI.Models.Entities.Usuario>();
            var libros = _libroBusiness?.Listar() ?? new List<NeoLibroAPI.Models.DTOs.LibroDTO>();
            var ejemplares = _ejemplarBusiness?.Listar() ?? new List<NeoLibroAPI.Models.Entities.Ejemplar>();
            var prestamos = _prestamoBusiness?.ListarPrestamosActivos() ?? new List<NeoLibroAPI.Models.DTOs.PrestamoDTO>();
            var multas = _multaBusiness?.ListarMultasPendientes() ?? new List<NeoLibroAPI.Models.Entities.Multa>();

            var prestamosVencidos = prestamos != null 
                ? prestamos.Count(p => 
                    (p.Estado == "Atrasado" || p.Estado == "ATRASADO") || 
                    (p.EstadoCalculado != null && p.EstadoCalculado == "Atrasado") ||
                    (p.Estado == "Prestado" && p.FechaVencimiento < DateTime.Now))
                : 0;

            var montoTotalMultas = multas != null && multas.Any() 
                ? multas.Sum(m => m.Monto) 
                : 0;

            return new EstadisticasGeneralesData
            {
                totalUsuarios = usuarios?.Count ?? 0,
                totalLibros = libros?.Count ?? 0,
                totalEjemplares = ejemplares?.Count ?? 0,
                prestamosActivos = prestamos?.Count ?? 0,
                prestamosVencidos = prestamosVencidos,
                multasPendientes = multas?.Count ?? 0,
                montoTotalMultas = montoTotalMultas
            };
        }

        private List<PrestamoPorMesData> ObtenerDatosPrestamosPorMes()
        {
            var año = DateTime.Now.Year;
            var prestamos = _prestamoBusiness.ListarPrestamosActivos()
                .Where(p => p.FechaPrestamo.Year == año)
                .ToList();

            var meses = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                              "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };
            var resultado = new List<PrestamoPorMesData>();

            for (int i = 1; i <= 12; i++)
            {
                var cantidad = prestamos.Count(p => p.FechaPrestamo.Month == i);
                resultado.Add(new PrestamoPorMesData { mes = meses[i - 1], cantidad = cantidad });
            }

            return resultado;
        }

        private List<LibroMasPrestadoData> ObtenerDatosLibrosMasPrestados(int limite)
        {
            var prestamos = _prestamoBusiness.ListarPrestamosActivos();
            var resultado = prestamos
                .GroupBy(p => p.LibroTitulo)
                .Select(g => new LibroMasPrestadoData { titulo = g.Key ?? "Sin título", prestamos = g.Count() })
                .OrderByDescending(x => x.prestamos)
                .Take(limite)
                .ToList();

            return resultado;
        }

        private List<UsuarioMasActivoData> ObtenerDatosUsuariosMasActivos(int limite)
        {
            var prestamos = _prestamoBusiness.ListarPrestamosActivos();
            var resultado = prestamos
                .GroupBy(p => p.UsuarioNombre)
                .Select(g => new UsuarioMasActivoData { nombre = g.Key ?? "Sin nombre", prestamos = g.Count() })
                .OrderByDescending(x => x.prestamos)
                .Take(limite)
                .ToList();

            return resultado;
        }

        private List<EstadisticaPorRolData> ObtenerDatosEstadisticasPorRol()
        {
            var usuarios = _usuarioBusiness.Listar();
            var resultado = usuarios
                .GroupBy(u => u.Rol)
                .Select(g => new EstadisticaPorRolData { rol = g.Key ?? "Sin rol", cantidad = g.Count() })
                .ToList();

            return resultado;
        }

        private object ObtenerDatosActividadDiaria()
        {
            var fechaConsulta = DateTime.Today;
            var prestamos = _prestamoBusiness.ListarPrestamosActivos();
            var multas = _multaBusiness.ListarMultasPendientes();

            return new
            {
                fecha = fechaConsulta.ToString("yyyy-MM-dd"),
                prestamosHoy = prestamos.Count(p => p.FechaPrestamo.Date == fechaConsulta),
                devolucionesHoy = prestamos.Count(p => p.FechaDevolucion?.Date == fechaConsulta),
                multasGeneradasHoy = multas.Count(m => m.FechaCobro?.Date == fechaConsulta),
                multasPagadasHoy = multas.Count(m => m.Estado == "Pagada")
            };
        }

        private RendimientoData ObtenerDatosRendimientoBiblioteca(int meses)
        {
            var fechaInicio = DateTime.Now.AddMonths(-meses);
            var connectionString = _configuration.GetConnectionString("cnnNeoLibroDB");
            
            int totalPrestamos = 0;
            int prestamosCompletados = 0;
            int prestamosVencidos = 0;

            // Consultar directamente la base de datos para obtener todos los préstamos del período
            try
            {
                using (var cn = new SqlConnection(connectionString))
                {
                    cn.Open();
                    
                    // Contar total de préstamos en el período
                    var cmdTotal = new SqlCommand(@"
                        SELECT COUNT(*) 
                        FROM Prestamos 
                        WHERE FechaPrestamo >= @FechaInicio", cn);
                    cmdTotal.Parameters.AddWithValue("@FechaInicio", fechaInicio);
                    totalPrestamos = Convert.ToInt32(cmdTotal.ExecuteScalar());

                    // Contar préstamos completados (con FechaDevolucion no nula en el período)
                    var cmdCompletados = new SqlCommand(@"
                        SELECT COUNT(*) 
                        FROM Prestamos 
                        WHERE FechaPrestamo >= @FechaInicio 
                        AND FechaDevolucion IS NOT NULL", cn);
                    cmdCompletados.Parameters.AddWithValue("@FechaInicio", fechaInicio);
                    prestamosCompletados = Convert.ToInt32(cmdCompletados.ExecuteScalar());

                    // Contar préstamos vencidos (activos con fecha de vencimiento pasada)
                    var cmdVencidos = new SqlCommand(@"
                        SELECT COUNT(*) 
                        FROM Prestamos 
                        WHERE FechaPrestamo >= @FechaInicio 
                        AND Estado = 'Prestado' 
                        AND FechaVencimiento < GETDATE()", cn);
                    cmdVencidos.Parameters.AddWithValue("@FechaInicio", fechaInicio);
                    prestamosVencidos = Convert.ToInt32(cmdVencidos.ExecuteScalar());
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error consultando préstamos: {ex.Message}");
                // En caso de error, usar los métodos existentes como fallback
                var prestamos = _prestamoBusiness.ListarPrestamosActivos()
                    .Where(p => p.FechaPrestamo >= fechaInicio)
                    .ToList();
                totalPrestamos = prestamos.Count;
                prestamosCompletados = 0; // No se pueden contar con ListarPrestamosActivos
                prestamosVencidos = prestamos.Count(p => 
                    p.Estado == "Atrasado" || 
                    p.EstadoCalculado == "Atrasado" ||
                    (p.Estado == "Prestado" && p.FechaVencimiento < DateTime.Now));
            }

            var multas = _multaBusiness.ListarMultasPendientes()
                .Where(m => m.FechaCobro >= fechaInicio)
                .ToList();

            var montoTotalMultas = multas != null && multas.Any() 
                ? multas.Sum(m => m.Monto) 
                : 0;
            
            var multasPagadas = multas != null 
                ? multas.Count(m => m.Estado == "Pagada" || m.Estado == "PAGADA") 
                : 0;

            return new RendimientoData
            {
                periodo = $"{meses} meses",
                fechaInicio = fechaInicio.ToString("yyyy-MM-dd"),
                fechaFin = DateTime.Now.ToString("yyyy-MM-dd"),
                totalPrestamos = totalPrestamos,
                prestamosCompletados = prestamosCompletados,
                prestamosVencidos = prestamosVencidos,
                tasaDevolucion = totalPrestamos > 0 ? 
                    (double)prestamosCompletados / totalPrestamos * 100 : 0,
                totalMultas = multas?.Count ?? 0,
                montoTotalMultas = montoTotalMultas,
                multasPagadas = multasPagadas,
                tasaPagoMultas = multas != null && multas.Count > 0 ? 
                    (double)multasPagadas / multas.Count * 100 : 0
            };
        }
    }
}
