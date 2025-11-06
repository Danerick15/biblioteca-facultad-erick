-- Procedimiento para aprobar una reserva y crear el préstamo de forma atómica
-- Busca un ejemplar disponible, lo marca como prestado, inserta el préstamo
-- y actualiza la reserva. Utiliza locks para evitar condiciones de carrera.
CREATE PROCEDURE sp_AprobarReserva_CrearPrestamo
    @ReservaID INT,
    @AdministradorID INT,
    @DiasPrestamo INT = 15
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Bloquear la reserva para evitar concurrencia
        DECLARE @UsuarioID INT, @LibroID INT, @EjemplarID INT;
        SELECT @UsuarioID = UsuarioID, @LibroID = LibroID, @EjemplarID = EjemplarID
        FROM Reservas WITH (UPDLOCK, ROWLOCK)
        WHERE ReservaID = @ReservaID;

        IF @UsuarioID IS NULL
        BEGIN
            -- Reserva no encontrada
            ROLLBACK TRANSACTION;
            RETURN -1;
        END

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
        UPDATE Reservas
        SET EjemplarID = @EjemplarID,
            Estado = 'Completada',
            FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE())
        WHERE ReservaID = @ReservaID;

        -- Insertar préstamo. Manejar ambos esquemas posibles (con o sin columnas UsuarioID/EjemplarID)
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
            -- Esquema inesperado
            ROLLBACK TRANSACTION;
            RETURN -3;
        END

        -- Crear notificación de préstamo listo
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
