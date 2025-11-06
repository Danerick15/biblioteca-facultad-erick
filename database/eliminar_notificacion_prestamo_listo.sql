-- Script para eliminar la notificación innecesaria "Se ha creado tu préstamo y el ejemplar está listo para retiro"
-- del stored procedure sp_AprobarReserva_CrearPrestamo

USE BibliotecaFISI;
GO

-- Verificar si el stored procedure existe
IF OBJECT_ID('dbo.sp_AprobarReserva_CrearPrestamo', 'P') IS NOT NULL
BEGIN
    -- Eliminar el stored procedure existente
    DROP PROCEDURE dbo.sp_AprobarReserva_CrearPrestamo;
    PRINT 'Stored procedure eliminado. Creando nueva versión sin la notificación innecesaria...';
END
GO

-- Crear el stored procedure sin la notificación innecesaria
-- Este stored procedure maneja diferentes esquemas de base de datos dinámicamente
CREATE PROCEDURE sp_AprobarReserva_CrearPrestamo
    @ReservaID INT,
    @AdministradorID INT,
    @DiasPrestamo INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Verificar existencia de la reserva primero
        DECLARE @ReservaExists INT = 0;
        SELECT @ReservaExists = COUNT(1) FROM Reservas WHERE ReservaID = @ReservaID;
        IF @ReservaExists = 0
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -1;
        END

        -- Bloquear y leer columnas de Reservas de forma dinámica
        DECLARE @UsuarioID INT = NULL, @LibroID INT = NULL, @EjemplarID INT = NULL;
        DECLARE @hasReservaEjemplar BIT = CASE WHEN COL_LENGTH('Reservas','EjemplarID') IS NOT NULL THEN 1 ELSE 0 END;
        DECLARE @hasReservaUsuario BIT = CASE WHEN COL_LENGTH('Reservas','UsuarioID') IS NOT NULL THEN 1 ELSE 0 END;
        DECLARE @sql NVARCHAR(MAX);

        IF @hasReservaUsuario = 1 AND @hasReservaEjemplar = 1
            SET @sql = N'SELECT @UsuarioID = UsuarioID, @LibroID = LibroID, @EjemplarID = EjemplarID FROM Reservas WITH (UPDLOCK, ROWLOCK) WHERE ReservaID = @ReservaID';
        ELSE IF @hasReservaUsuario = 1 AND @hasReservaEjemplar = 0
            SET @sql = N'SELECT @UsuarioID = UsuarioID, @LibroID = LibroID FROM Reservas WITH (UPDLOCK, ROWLOCK) WHERE ReservaID = @ReservaID';
        ELSE IF @hasReservaUsuario = 0 AND @hasReservaEjemplar = 1
            SET @sql = N'SELECT @LibroID = LibroID, @EjemplarID = EjemplarID FROM Reservas WITH (UPDLOCK, ROWLOCK) WHERE ReservaID = @ReservaID';
        ELSE
            SET @sql = N'SELECT @LibroID = LibroID FROM Reservas WITH (UPDLOCK, ROWLOCK) WHERE ReservaID = @ReservaID';

        EXEC sp_executesql @sql,
            N'@ReservaID INT, @UsuarioID INT OUTPUT, @LibroID INT OUTPUT, @EjemplarID INT OUTPUT',
            @ReservaID = @ReservaID,
            @UsuarioID = @UsuarioID OUTPUT,
            @LibroID = @LibroID OUTPUT,
            @EjemplarID = @EjemplarID OUTPUT;

        -- Verificar estado actual para no reprocesar
        DECLARE @EstadoActual VARCHAR(50);
        SELECT @EstadoActual = Estado FROM Reservas WITH (NOLOCK) WHERE ReservaID = @ReservaID;
        IF @EstadoActual IN ('Completada','Cancelada','Expirada')
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -2;
        END

        -- Si la reserva ya tiene ejemplar asignado, intentaremos usar ese ejemplar
        IF @EjemplarID IS NULL
        BEGIN
            SELECT TOP(1) @EjemplarID = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, READPAST)
            WHERE LibroID = @LibroID AND Estado = 'Disponible'
            ORDER BY FechaAlta;
        END
        ELSE
        BEGIN
            SELECT @EjemplarID = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, ROWLOCK)
            WHERE EjemplarID = @EjemplarID AND Estado = 'Disponible';
        END

        IF @EjemplarID IS NULL
        BEGIN
            UPDATE Reservas
            SET Estado = 'Aprobada', FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
            WHERE ReservaID = @ReservaID;

            INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
            VALUES (@ReservaID, @UsuarioID, 'ReservaAprobada', 'Tu reserva ha sido aprobada pero no se asignó ejemplar. Por favor comunícate con la biblioteca.', GETDATE(), 'Pendiente');

            COMMIT TRANSACTION;
            RETURN 0;
        END

        -- Marcar ejemplar como Prestado
        UPDATE Ejemplares
        SET Estado = 'Prestado'
        WHERE EjemplarID = @EjemplarID;

        -- Actualizar reserva: asignar ejemplar y marcar completada
        IF @hasReservaEjemplar = 1
        BEGIN
            UPDATE Reservas
            SET EjemplarID = @EjemplarID,
                Estado = 'Completada',
                FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
            WHERE ReservaID = @ReservaID;
        END
        ELSE
        BEGIN
            UPDATE Reservas
            SET Estado = 'Completada',
                FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
            WHERE ReservaID = @ReservaID;
        END

        -- Insertar préstamo
        DECLARE @PrestamoID INT;

        IF COL_LENGTH('Prestamos','EjemplarID') IS NOT NULL AND COL_LENGTH('Prestamos','UsuarioID') IS NOT NULL
        BEGIN
            INSERT INTO Prestamos (ReservaID, EjemplarID, UsuarioID, FechaPrestamo, FechaVencimiento, Estado)
            VALUES (@ReservaID, @EjemplarID, @UsuarioID, GETDATE(), DATEADD(DAY, @DiasPrestamo, GETDATE()), 'Prestado');
            SET @PrestamoID = SCOPE_IDENTITY();
        END
        ELSE IF COL_LENGTH('Prestamos','ReservaID') IS NOT NULL
        BEGIN
            INSERT INTO Prestamos (ReservaID, FechaPrestamo, FechaVencimiento, Estado)
            VALUES (@ReservaID, GETDATE(), DATEADD(DAY, @DiasPrestamo, GETDATE()), 'Prestado');
            SET @PrestamoID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            ROLLBACK TRANSACTION;
            RETURN -3;
        END

        -- NOTA: Se eliminó la notificación "Se ha creado tu préstamo y el ejemplar está listo para retiro"
        -- porque es innecesaria. El código C# crea una notificación más detallada con el nombre del ejemplar
        -- y fecha/hora específica después de ejecutar este stored procedure.

        COMMIT TRANSACTION;
        RETURN @PrestamoID;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('Error en sp_AprobarReserva_CrearPrestamo: %s', 16, 1, @msg);
        RETURN -99;
    END CATCH
END
GO

PRINT 'Stored procedure sp_AprobarReserva_CrearPrestamo actualizado exitosamente.';
PRINT 'La notificación innecesaria ha sido eliminada.';
GO

