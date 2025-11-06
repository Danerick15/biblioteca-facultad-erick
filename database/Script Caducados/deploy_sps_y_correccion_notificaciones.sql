/*
  deploy_sps_y_correccion_notificaciones.sql

  Script único e idempotente para:
    1) Corregir Notificaciones (actualizar NULLs y crear DEFAULT si falta)
    2) Crear/actualizar el procedimiento sp_AsignarEjemplarParaReserva
    3) Crear/actualizar el procedimiento sp_AprobarReserva_CrearPrestamo

  Instrucciones:
    - Ejecutar este script en la base de datos destino (ej. BibliotecaFISI).
    - Requiere permisos para crear procedimientos y alterar tablas.
    - El script es idempotente: realiza DROP IF EXISTS antes de crear.

  Uso desde PowerShell (ejemplo):
    sqlcmd -S <SERVIDOR> -d <BASE_DATOS> -i "d:\2025-2\DSW\biblioteca-facultad\database\deploy_sps_y_correccion_notificaciones.sql"

*/

SET NOCOUNT ON;
GO

PRINT '--- 1) Aplicando corrección de Notificaciones (filas NULL + default) ---';
BEGIN TRANSACTION;
BEGIN TRY

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = 'Notificaciones' AND c.name = 'Estado'
    )
    BEGIN
        PRINT 'La columna Notificaciones.Estado no existe en esta base de datos. Abortando corrección.';
        ROLLBACK TRANSACTION;
    END
    ELSE
    BEGIN
        PRINT 'Actualizando filas existentes con Estado NULL a ''Pendiente''...';
        UPDATE Notificaciones SET Estado = 'Pendiente' WHERE Estado IS NULL;

        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints dc
            INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
            WHERE OBJECT_NAME(dc.parent_object_id) = 'Notificaciones' AND c.name = 'Estado'
        )
        BEGIN
            PRINT 'Creando constraint DEFAULT DF_Notificaciones_Estado...';
            ALTER TABLE Notificaciones ADD CONSTRAINT DF_Notificaciones_Estado DEFAULT ('Pendiente') FOR Estado;
        END
        ELSE
        BEGIN
            PRINT 'Constraint DEFAULT para Notificaciones.Estado ya existe.';
        END

        COMMIT TRANSACTION;
        PRINT 'Corrección de Notificaciones aplicada correctamente.';
    END

END TRY
BEGIN CATCH
    PRINT 'Error al aplicar la corrección de Notificaciones:';
    PRINT ERROR_MESSAGE();
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO

PRINT '--- 2) Creando/actualizando sp_AsignarEjemplarParaReserva ---';
IF OBJECT_ID('dbo.sp_AsignarEjemplarParaReserva', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AsignarEjemplarParaReserva;
GO

CREATE PROCEDURE sp_AsignarEjemplarParaReserva
    @LibroID INT,
    @RequestedEjemplarID INT = NULL,
    @EjemplarAsignado INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Inicializar
        SET @EjemplarAsignado = 0;

        IF @RequestedEjemplarID IS NULL
        BEGIN
            -- Buscar y lockear el primer ejemplar disponible
            SELECT TOP(1) @EjemplarAsignado = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, READPAST)
            WHERE LibroID = @LibroID AND Estado = 'Disponible'
            ORDER BY FechaAlta;
        END
        ELSE
        BEGIN
            -- Intentar usar el ejemplar solicitado (si está disponible)
            SELECT @EjemplarAsignado = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, ROWLOCK)
            WHERE EjemplarID = @RequestedEjemplarID AND Estado = 'Disponible' AND LibroID = @LibroID;
        END

        IF @EjemplarAsignado IS NULL OR @EjemplarAsignado = 0
        BEGIN
            -- No hay ejemplares disponibles
            SET @EjemplarAsignado = 0;
            COMMIT TRANSACTION;
            RETURN 0;
        END

        -- Marcar ejemplar como Reservado para evitar dobles asignaciones
        UPDATE Ejemplares
        SET Estado = 'Reservado'
        WHERE EjemplarID = @EjemplarAsignado;

        COMMIT TRANSACTION;
        RETURN 1;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR('sp_AsignarEjemplarParaReserva error: %s', 16, 1, @msg);
        SET @EjemplarAsignado = 0;
        RETURN -1;
    END CATCH
END
GO

PRINT '--- 3) Creando/actualizando sp_AprobarReserva_CrearPrestamo ---';
IF OBJECT_ID('dbo.sp_AprobarReserva_CrearPrestamo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AprobarReserva_CrearPrestamo;
GO

CREATE PROCEDURE sp_AprobarReserva_CrearPrestamo
    @ReservaID INT,
    @AdministradorID INT,
    @DiasPrestamo INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Verificar existencia de la reserva primero (evita referencias a columnas inexistentes)
        DECLARE @ReservaExists INT = 0;
        SELECT @ReservaExists = COUNT(1) FROM Reservas WHERE ReservaID = @ReservaID;
        IF @ReservaExists = 0
        BEGIN
            -- Reserva no encontrada
            ROLLBACK TRANSACTION;
            RETURN -1;
        END

        -- Bloquear y leer columnas de Reservas de forma dinámica.
        -- Algunas instalaciones históricas tienen esquemas diferentes (p.ej. sin columnas EjemplarID o UsuarioID),
        -- por eso usamos COL_LENGTH() y SQL dinámico para evitar errores de compilación.
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
            RETURN -2; -- estado final, no procesar
        END

        -- Si la reserva ya tiene ejemplar asignado, intentaremos usar ese ejemplar
        IF @EjemplarID IS NULL
        BEGIN
            -- Buscar primer ejemplar disponible y lockearlo para actualización
            SELECT TOP(1) @EjemplarID = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, READPAST)
            WHERE LibroID = @LibroID AND Estado = 'Disponible'
            ORDER BY FechaAlta;
        END
        ELSE
        BEGIN
            -- asegurar que el ejemplar asignado sigue disponible
            SELECT @EjemplarID = EjemplarID
            FROM Ejemplares WITH (UPDLOCK, ROWLOCK)
            WHERE EjemplarID = @EjemplarID AND Estado = 'Disponible';
        END

        IF @EjemplarID IS NULL
        BEGIN
            -- No hay ejemplares disponibles; marcar reserva como Aprobada y dejarla para retiro manual
            UPDATE Reservas
            SET Estado = 'Aprobada', FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
            WHERE ReservaID = @ReservaID;

            INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
            VALUES (@ReservaID, @UsuarioID, 'ReservaAprobada', 'Tu reserva ha sido aprobada pero no se asignó ejemplar. Por favor comunícate con la biblioteca.', GETDATE(), 'Pendiente');

            COMMIT TRANSACTION;
            RETURN 0; -- aprobado pero sin préstamo
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
            -- Esquema sin columna EjemplarID: actualizar solo campos existentes
            UPDATE Reservas
            SET Estado = 'Completada',
                FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
            WHERE ReservaID = @ReservaID;
        END

        -- Insertar préstamo (esquema conocido: Prestamos referencia a ReservaID)
        DECLARE @PrestamoID INT;

        INSERT INTO Prestamos (ReservaID, FechaPrestamo, FechaVencimiento, Estado)
        VALUES (@ReservaID, GETDATE(), DATEADD(DAY, @DiasPrestamo, GETDATE()), 'Prestado');
        SET @PrestamoID = SCOPE_IDENTITY();

        -- Crear notificación de préstamo listo (UsuarioID puede ser NULL si no existe la columna en Reservas)
        INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
        VALUES (@ReservaID, @UsuarioID, 'PrestamoCreado', 'Se ha creado tu préstamo y el ejemplar está listo para retiro.', GETDATE(), 'Pendiente');

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

PRINT '--- FIN: deploy_sps_y_correccion_notificaciones.sql ---';
PRINT 'Verifique con: SELECT OBJECT_ID(''dbo.sp_AsignarEjemplarParaReserva''); SELECT OBJECT_ID(''dbo.sp_AprobarReserva_CrearPrestamo'');';
GO
