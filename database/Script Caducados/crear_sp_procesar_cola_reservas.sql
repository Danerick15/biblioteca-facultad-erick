-- Procedimiento almacenado para procesar la cola de reservas de un libro
-- Busca el primer ejemplar disponible y la primera reserva en cola y asigna
-- Actualiza la reserva a PorAprobar, fija FechaLimiteRetiro y crea notificación

CREATE PROCEDURE sp_ProcesarColaReservas
    @LibroID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ReservaID INT;
    DECLARE @UsuarioID INT;
    DECLARE @EjemplarID INT;

    -- Buscar primer ejemplar disponible
    SELECT TOP(1) @EjemplarID = EjemplarID
    FROM Ejemplares
    WHERE LibroID = @LibroID AND Estado = 'Disponible'
    ORDER BY FechaAlta;

    IF @EjemplarID IS NULL
    BEGIN
        -- No hay ejemplares disponibles, nada que hacer
        RETURN;
    END

    -- Buscar primera reserva en cola para este libro
    SELECT TOP(1) @ReservaID = ReservaID, @UsuarioID = UsuarioID
    FROM Reservas
    WHERE LibroID = @LibroID AND Estado = 'ColaEspera' AND TipoReserva = 'ColaEspera'
    ORDER BY PrioridadCola, FechaReserva;

    IF @ReservaID IS NULL
    BEGIN
        -- No hay reservas en cola
        RETURN;
    END

    -- Actualizar la reserva: asignar ejemplar y pasar a PorAprobar
    UPDATE Reservas
    SET EjemplarID = @EjemplarID,
        Estado = 'PorAprobar',
        FechaLimiteRetiro = DATEADD(DAY, 2, GETDATE()),
        EstadoNotificacion = 'Pendiente'
    WHERE ReservaID = @ReservaID;

    -- Crear notificación para el usuario
    INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
    VALUES (@ReservaID, @UsuarioID, 'ReservaDisponible', 'Tu reserva está disponible para retiro. Por favor acércate en los próximos 2 días.', GETDATE(), 'Pendiente');

    -- Marcar el ejemplar como 'Reservado' para evitar dobles asignaciones (opcional)
    UPDATE Ejemplares
    SET Estado = 'Reservado'
    WHERE EjemplarID = @EjemplarID;

    -- Actualizar prioridades de la cola: disminuir prioridad de los que estaban detrás
    UPDATE Reservas
    SET PrioridadCola = PrioridadCola - 1
    WHERE LibroID = @LibroID AND PrioridadCola > (
        SELECT PrioridadCola FROM Reservas WHERE ReservaID = @ReservaID
    ) AND Estado = 'ColaEspera' AND TipoReserva = 'ColaEspera';

END
