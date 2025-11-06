-- Procedimiento que asigna (reserva) un ejemplar disponible para un libro
-- Parámetros:
--   @LibroID INT: libro para el que se busca ejemplar
--   @RequestedEjemplarID INT NULL: si se quiere un ejemplar específico (opcional)
--   @EjemplarAsignado INT OUTPUT: devuelve el EjemplarID asignado, 0 si no hay ninguno

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
