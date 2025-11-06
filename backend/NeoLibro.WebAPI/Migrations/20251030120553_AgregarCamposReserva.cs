using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoLibro.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamposReserva : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Autor",
                columns: table => new
                {
                    AutorID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Biografia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ORCID = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Autor", x => x.AutorID);
                });

            migrationBuilder.CreateTable(
                name: "Categoria",
                columns: table => new
                {
                    CategoriaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categoria", x => x.CategoriaID);
                });

            migrationBuilder.CreateTable(
                name: "Libros",
                columns: table => new
                {
                    LibroID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ISBN = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Editorial = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AnioPublicacion = table.Column<int>(type: "int", nullable: true),
                    Idioma = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Paginas = table.Column<int>(type: "int", nullable: true),
                    LCCSeccion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LCCNumero = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LCCCutter = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SignaturaLCC = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Libros", x => x.LibroID);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    UsuarioID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CodigoUniversitario = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailInstitucional = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContrasenaHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaUltimaActualizacionContrasena = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.UsuarioID);
                });

            migrationBuilder.CreateTable(
                name: "AutorLibro",
                columns: table => new
                {
                    AutoresAutorID = table.Column<int>(type: "int", nullable: false),
                    LibrosLibroID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutorLibro", x => new { x.AutoresAutorID, x.LibrosLibroID });
                    table.ForeignKey(
                        name: "FK_AutorLibro_Autor_AutoresAutorID",
                        column: x => x.AutoresAutorID,
                        principalTable: "Autor",
                        principalColumn: "AutorID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AutorLibro_Libros_LibrosLibroID",
                        column: x => x.LibrosLibroID,
                        principalTable: "Libros",
                        principalColumn: "LibroID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CategoriaLibro",
                columns: table => new
                {
                    CategoriasCategoriaID = table.Column<int>(type: "int", nullable: false),
                    LibrosLibroID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriaLibro", x => new { x.CategoriasCategoriaID, x.LibrosLibroID });
                    table.ForeignKey(
                        name: "FK_CategoriaLibro_Categoria_CategoriasCategoriaID",
                        column: x => x.CategoriasCategoriaID,
                        principalTable: "Categoria",
                        principalColumn: "CategoriaID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoriaLibro_Libros_LibrosLibroID",
                        column: x => x.LibrosLibroID,
                        principalTable: "Libros",
                        principalColumn: "LibroID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Ejemplares",
                columns: table => new
                {
                    EjemplarID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LibroID = table.Column<int>(type: "int", nullable: false),
                    NumeroEjemplar = table.Column<int>(type: "int", nullable: false),
                    CodigoBarras = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ubicacion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaAlta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ejemplares", x => x.EjemplarID);
                    table.ForeignKey(
                        name: "FK_Ejemplares_Libros_LibroID",
                        column: x => x.LibroID,
                        principalTable: "Libros",
                        principalColumn: "LibroID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecursoDigital",
                columns: table => new
                {
                    RecursoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LibroID = table.Column<int>(type: "int", nullable: false),
                    URL = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Plataforma = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Licencia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Proveedor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DRM = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecursoDigital", x => x.RecursoID);
                    table.ForeignKey(
                        name: "FK_RecursoDigital_Libros_LibroID",
                        column: x => x.LibroID,
                        principalTable: "Libros",
                        principalColumn: "LibroID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Prestamos",
                columns: table => new
                {
                    PrestamoID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EjemplarID = table.Column<int>(type: "int", nullable: false),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    FechaPrestamo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaDevolucion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Renovaciones = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prestamos", x => x.PrestamoID);
                    table.ForeignKey(
                        name: "FK_Prestamos_Ejemplares_EjemplarID",
                        column: x => x.EjemplarID,
                        principalTable: "Ejemplares",
                        principalColumn: "EjemplarID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Prestamos_Usuarios_UsuarioID",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reservas",
                columns: table => new
                {
                    ReservaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LibroID = table.Column<int>(type: "int", nullable: false),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    EjemplarID = table.Column<int>(type: "int", nullable: true),
                    FechaReserva = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TipoReserva = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EstadoNotificacion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaLimiteRetiro = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PrioridadCola = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservas", x => x.ReservaID);
                    table.ForeignKey(
                        name: "FK_Reservas_Ejemplares_EjemplarID",
                        column: x => x.EjemplarID,
                        principalTable: "Ejemplares",
                        principalColumn: "EjemplarID");
                    table.ForeignKey(
                        name: "FK_Reservas_Libros_LibroID",
                        column: x => x.LibroID,
                        principalTable: "Libros",
                        principalColumn: "LibroID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservas_Usuarios_UsuarioID",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Multa",
                columns: table => new
                {
                    MultaID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrestamoID = table.Column<int>(type: "int", nullable: false),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiasAtraso = table.Column<int>(type: "int", nullable: true),
                    Motivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaCobro = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Multa", x => x.MultaID);
                    table.ForeignKey(
                        name: "FK_Multa_Prestamos_PrestamoID",
                        column: x => x.PrestamoID,
                        principalTable: "Prestamos",
                        principalColumn: "PrestamoID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Multa_Usuarios_UsuarioID",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    NotificacionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReservaID = table.Column<int>(type: "int", nullable: false),
                    UsuarioID = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaLectura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.NotificacionID);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Reservas_ReservaID",
                        column: x => x.ReservaID,
                        principalTable: "Reservas",
                        principalColumn: "ReservaID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Usuarios_UsuarioID",
                        column: x => x.UsuarioID,
                        principalTable: "Usuarios",
                        principalColumn: "UsuarioID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AutorLibro_LibrosLibroID",
                table: "AutorLibro",
                column: "LibrosLibroID");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriaLibro_LibrosLibroID",
                table: "CategoriaLibro",
                column: "LibrosLibroID");

            migrationBuilder.CreateIndex(
                name: "IX_Ejemplares_LibroID",
                table: "Ejemplares",
                column: "LibroID");

            migrationBuilder.CreateIndex(
                name: "IX_Multa_PrestamoID",
                table: "Multa",
                column: "PrestamoID");

            migrationBuilder.CreateIndex(
                name: "IX_Multa_UsuarioID",
                table: "Multa",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_Estado_UsuarioID",
                table: "Notificaciones",
                columns: new[] { "Estado", "UsuarioID" });

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_ReservaID",
                table: "Notificaciones",
                column: "ReservaID");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_UsuarioID",
                table: "Notificaciones",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_EjemplarID",
                table: "Prestamos",
                column: "EjemplarID");

            migrationBuilder.CreateIndex(
                name: "IX_Prestamos_UsuarioID",
                table: "Prestamos",
                column: "UsuarioID");

            migrationBuilder.CreateIndex(
                name: "IX_RecursoDigital_LibroID",
                table: "RecursoDigital",
                column: "LibroID");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_EjemplarID",
                table: "Reservas",
                column: "EjemplarID");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_LibroID",
                table: "Reservas",
                column: "LibroID");

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_TipoReserva_Estado_EstadoNotificacion",
                table: "Reservas",
                columns: new[] { "TipoReserva", "Estado", "EstadoNotificacion" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservas_UsuarioID",
                table: "Reservas",
                column: "UsuarioID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutorLibro");

            migrationBuilder.DropTable(
                name: "CategoriaLibro");

            migrationBuilder.DropTable(
                name: "Multa");

            migrationBuilder.DropTable(
                name: "Notificaciones");

            migrationBuilder.DropTable(
                name: "RecursoDigital");

            migrationBuilder.DropTable(
                name: "Autor");

            migrationBuilder.DropTable(
                name: "Categoria");

            migrationBuilder.DropTable(
                name: "Prestamos");

            migrationBuilder.DropTable(
                name: "Reservas");

            migrationBuilder.DropTable(
                name: "Ejemplares");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Libros");
        }
    }
}
