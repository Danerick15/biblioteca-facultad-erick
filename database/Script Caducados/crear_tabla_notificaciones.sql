-- Crear tabla Notificaciones si no existe (compatible con la migración AgregarCamposReserva)
IF OBJECT_ID('dbo.Notificaciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notificaciones (
        NotificacionID int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ReservaID int NOT NULL,
        UsuarioID int NOT NULL,
        Tipo nvarchar(50) NOT NULL,
        Mensaje nvarchar(500) NOT NULL,
        FechaCreacion datetime2 NOT NULL,
        FechaLectura datetime2 NULL,
        Estado nvarchar(20) NOT NULL
    );

    ALTER TABLE dbo.Notificaciones
    ADD CONSTRAINT FK_Notificaciones_Reservas_ReservaID FOREIGN KEY (ReservaID) REFERENCES dbo.Reservas(ReservaID) ON DELETE CASCADE;

    ALTER TABLE dbo.Notificaciones
    ADD CONSTRAINT FK_Notificaciones_Usuarios_UsuarioID FOREIGN KEY (UsuarioID) REFERENCES dbo.Usuarios(UsuarioID) ON DELETE NO ACTION;

    CREATE INDEX IX_Notificaciones_Estado_UsuarioID ON dbo.Notificaciones(Estado, UsuarioID);
    CREATE INDEX IX_Notificaciones_ReservaID ON dbo.Notificaciones(ReservaID);
    CREATE INDEX IX_Notificaciones_UsuarioID ON dbo.Notificaciones(UsuarioID);
END
ELSE
BEGIN
    PRINT 'La tabla dbo.Notificaciones ya existe.';
END
