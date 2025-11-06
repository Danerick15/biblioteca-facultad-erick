-- Agregar nuevas columnas a la tabla Reservas
ALTER TABLE Reservas
ADD EjemplarID int NULL,
    EstadoNotificacion nvarchar(20) NOT NULL DEFAULT 'Pendiente',
    FechaLimiteRetiro datetime2 NULL,
    TipoReserva nvarchar(20) NOT NULL DEFAULT 'ColaEspera';

-- Agregar la clave foránea para EjemplarID
ALTER TABLE Reservas
ADD CONSTRAINT FK_Reservas_Ejemplares
FOREIGN KEY (EjemplarID) REFERENCES Ejemplares(EjemplarID);