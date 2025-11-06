using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoLibro.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class CorregirConstraintReservas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            // Eliminar cualquier CHECK existente que haga referencia a la columna Estado
            migrationBuilder.Sql(@"DECLARE @sql nvarchar(max);
SELECT @sql = N'ALTER TABLE dbo.Reservas DROP CONSTRAINT ' + QUOTENAME(name)
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID(N'dbo.Reservas')
  AND definition LIKE '%[[]Estado]%';

IF @sql IS NOT NULL
BEGIN
    EXEC sp_executesql @sql;
END");

            // Normalizar valores inesperados para evitar conflictos al crear la nueva restricción
            migrationBuilder.Sql(@"UPDATE dbo.Reservas
SET Estado = 'ColaEspera'
WHERE Estado IS NULL
   OR Estado NOT IN (
        'ColaEspera',
        'PorAprobar',
        'Aprobada',
        'Completada',
        'Cancelada',
        'Expirada',
        'Notificada'
   );");

            // Crear la nueva restricción CHECK con los valores esperados por la aplicación
            migrationBuilder.Sql(@"ALTER TABLE dbo.Reservas
ADD CONSTRAINT CK_Reservas_Estado CHECK (
    Estado IN (
        'ColaEspera',
        'PorAprobar',
        'Aprobada',
        'Completada',
        'Cancelada',
        'Expirada',
        'Notificada'
    )
);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            // Eliminar la restricción creada en Up si existe
            migrationBuilder.Sql(@"IF OBJECT_ID(N'dbo.CK_Reservas_Estado','C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Reservas DROP CONSTRAINT CK_Reservas_Estado;
END");
        }
    }
}
