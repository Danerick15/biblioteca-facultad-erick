-- Añadir nuevos campos a la tabla Reservas
ALTER TABLE Reservas
ADD TipoReserva VARCHAR(20) NOT NULL DEFAULT 'ColaEspera',
    EstadoNotificacion VARCHAR(20) NOT NULL DEFAULT 'Pendiente';

-- Actualizar los estados existentes
UPDATE Reservas SET TipoReserva = 
    CASE 
        WHEN Estado = 'Activa' AND EXISTS (
            SELECT 1 FROM Ejemplares e 
            WHERE e.LibroID = Reservas.LibroID AND e.Estado = 'Disponible'
        ) THEN 'Retiro'
        ELSE 'ColaEspera'
    END;

-- Normalizar estado: mapear valores antiguos (p.ej. 'Activa') al nuevo conjunto
UPDATE Reservas
SET Estado = 'ColaEspera'
WHERE Estado = 'Activa';

-- Crear índice para búsquedas eficientes
CREATE INDEX IX_Reservas_TipoEstado 
ON Reservas(TipoReserva, Estado, EstadoNotificacion);

-- Crear tabla de notificaciones
CREATE TABLE Notificaciones (
    NotificacionID INT IDENTITY(1,1) PRIMARY KEY,
    ReservaID INT REFERENCES Reservas(ReservaID),
    UsuarioID INT REFERENCES Usuarios(UsuarioID),
    Tipo VARCHAR(50) NOT NULL,
    Mensaje NVARCHAR(500) NOT NULL,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaLectura DATETIME NULL,
    Estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
);

-- Crear índice para búsquedas de notificaciones pendientes
CREATE INDEX IX_Notificaciones_Estado 
ON Notificaciones(Estado, UsuarioID);

GO

-- Crear procedimiento para procesar la cola de reservas
CREATE OR ALTER PROCEDURE sp_ProcesarColaReservas
    @LibroID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PrimeraReservaID INT;
    
    -- Obtener la primera reserva en cola (estado ColaEspera)
    SELECT TOP 1 @PrimeraReservaID = ReservaID
    FROM Reservas
    WHERE LibroID = @LibroID 
    AND Estado = 'ColaEspera'
    AND TipoReserva = 'ColaEspera'
    ORDER BY FechaReserva;
    
    IF @PrimeraReservaID IS NOT NULL
    BEGIN
        -- Actualizar la reserva a tipo Retiro
        UPDATE Reservas 
        SET TipoReserva = 'Retiro',
            EstadoNotificacion = 'Pendiente'
        WHERE ReservaID = @PrimeraReservaID;
        
        -- Crear notificaciones (especificar FechaCreacion y Estado para evitar NULL en esquemas estrictos)
        INSERT INTO Notificaciones (ReservaID, UsuarioID, Tipo, Mensaje, FechaCreacion, Estado)
        SELECT 
            @PrimeraReservaID,
            CASE 
                WHEN u.Rol IN ('Bibliotecaria', 'Administrador') THEN u.UsuarioID 
                ELSE r.UsuarioID 
            END,
            CASE 
                WHEN u.Rol IN ('Bibliotecaria', 'Administrador') 
                THEN 'NuevaReservaParaRetiro'
                ELSE 'EjemplarDisponible'
            END,
            CASE 
                WHEN u.Rol IN ('Bibliotecaria', 'Administrador')
                THEN 'Nueva reserva lista para retiro del libro: ' + l.Titulo
                ELSE 'El ejemplar que reservaste del libro ' + l.Titulo + ' está disponible para retiro'
            END,
            GETDATE(),
            'Pendiente'
        FROM Reservas r
        INNER JOIN Libros l ON r.LibroID = l.LibroID
        CROSS JOIN Usuarios u
        WHERE r.ReservaID = @PrimeraReservaID
        AND (u.Rol IN ('Bibliotecaria', 'Administrador') OR u.UsuarioID = r.UsuarioID);
    END
END
GO