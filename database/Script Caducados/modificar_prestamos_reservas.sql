-- Actualizar estructura de las tablas Prestamos y Reservas
USE BibliotecaFISI;
GO

-- 0. Analizar estructura actual
-- Verificar estructura de Prestamos
SELECT 
    c.TABLE_NAME,
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_DEFAULT,
    tc.CONSTRAINT_TYPE,
    ccu.COLUMN_NAME as REFERENCED_COLUMN,
    ccu.TABLE_NAME as REFERENCED_TABLE
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
    ON c.COLUMN_NAME = ccu.COLUMN_NAME 
    AND c.TABLE_NAME = ccu.TABLE_NAME
LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
    ON tc.CONSTRAINT_NAME = ccu.CONSTRAINT_NAME
WHERE c.TABLE_NAME IN ('Prestamos', 'Reservas')
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;

-- 1. Eliminar foreign keys existentes
DECLARE @dropFK NVARCHAR(MAX) = '';

-- Encontrar FKs que referencian a Prestamos
SELECT @dropFK += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + '; '
FROM sys.foreign_keys
WHERE referenced_object_id = OBJECT_ID('Prestamos');

-- Encontrar FKs de Prestamos que apuntan a otras tablas
SELECT @dropFK += 'ALTER TABLE [dbo].[Prestamos] DROP CONSTRAINT ' + QUOTENAME(name) + '; '
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('Prestamos');

IF @dropFK > ''
    EXEC sp_executesql @dropFK;

-- 1. Verificar estructura actual de Reservas
SELECT 
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_DEFAULT,
    CASE 
        WHEN pk.COLUMN_NAME IS NOT NULL THEN 'PRIMARY KEY'
        ELSE ''
    END AS KeyType
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE pk 
    ON c.TABLE_NAME = pk.TABLE_NAME 
    AND c.COLUMN_NAME = pk.COLUMN_NAME 
    AND pk.CONSTRAINT_NAME LIKE 'PK_%'
WHERE c.TABLE_NAME = 'Reservas';

-- 2. Respaldar datos existentes y estructura
IF OBJECT_ID('tempdb..#TempPrestamos') IS NOT NULL
    DROP TABLE #TempPrestamos;

SELECT 
    p.*,
    r.ReservaID
INTO #TempPrestamos
FROM Prestamos p
LEFT JOIN Reservas r ON 
    r.UsuarioID = p.UsuarioID 
    AND r.LibroID = (
        SELECT LibroID 
        FROM Ejemplares 
        WHERE EjemplarID = p.EjemplarID
    )
    AND r.Estado = 'Aprobada';

-- 3. Eliminar tabla Prestamos actual y sus dependencias
DECLARE @dropConstraintsPrestamos NVARCHAR(MAX) = '';

-- Encontrar todos los constraints que dependen de Prestamos
SELECT @dropConstraintsPrestamos += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + '; '
FROM sys.objects
WHERE type_desc LIKE '%CONSTRAINT'
AND parent_object_id = OBJECT_ID('Prestamos');

-- Ejecutar drops de constraints
IF @dropConstraintsPrestamos > ''
    EXEC sp_executesql @dropConstraintsPrestamos;

-- Ahora sí podemos eliminar la tabla
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'Prestamos') AND type = 'U')
BEGIN
    DROP TABLE Prestamos;
END

-- 4. Verificar y actualizar estructura de Reservas
-- Primero respaldamos los datos de Reservas
IF OBJECT_ID('tempdb..#TempReservas') IS NOT NULL
    DROP TABLE #TempReservas;

SELECT * INTO #TempReservas FROM Reservas;

DECLARE @dropConstraintsReservas NVARCHAR(MAX) = '';
SELECT @dropConstraintsReservas += 'ALTER TABLE [dbo].[Reservas] DROP CONSTRAINT ' + QUOTENAME(name) + '; '
FROM sys.objects
WHERE type_desc LIKE '%CONSTRAINT'
AND parent_object_id = OBJECT_ID('Reservas');

IF @dropConstraintsReservas > ''
    EXEC sp_executesql @dropConstraintsReservas;

-- Eliminamos la tabla Reservas
DROP TABLE Reservas;

-- Recreamos la tabla Reservas con la estructura correcta
CREATE TABLE Reservas (
    ReservaID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL,
    LibroID INT NOT NULL,
    EjemplarID INT NULL,
    FechaReserva DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(20) NOT NULL DEFAULT 'ColaEspera',
    EstadoNotificacion VARCHAR(20) DEFAULT 'Pendiente',
    TipoReserva VARCHAR(20) DEFAULT 'ColaEspera',
    CONSTRAINT FK_Reservas_Usuarios FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID),
    CONSTRAINT FK_Reservas_Libros FOREIGN KEY (LibroID) REFERENCES Libros(LibroID),
    CONSTRAINT FK_Reservas_Ejemplares FOREIGN KEY (EjemplarID) REFERENCES Ejemplares(EjemplarID),
    CONSTRAINT CK_Reservas_Estado CHECK (Estado IN ('ColaEspera', 'PorAprobar', 'Aprobada', 'Completada', 'Cancelada', 'Expirada')),
    CONSTRAINT CK_Reservas_EstadoNotificacion CHECK (EstadoNotificacion IN ('Pendiente', 'Enviada', 'Error')),
    CONSTRAINT CK_Reservas_TipoReserva CHECK (TipoReserva IN ('Retiro', 'ColaEspera'))
);

-- Reinsertamos los datos
SET IDENTITY_INSERT Reservas ON;
INSERT INTO Reservas (
    ReservaID, UsuarioID, LibroID, EjemplarID, 
    FechaReserva, Estado, 
    EstadoNotificacion, TipoReserva
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) as ReservaID,
    UsuarioID, 
    LibroID, 
    EjemplarID,
    FechaReserva,
    CASE WHEN Estado IS NULL THEN 'ColaEspera' ELSE Estado END,
    COALESCE(EstadoNotificacion, 'Pendiente'),
    COALESCE(TipoReserva, 'ColaEspera')
FROM #TempReservas;
SET IDENTITY_INSERT Reservas OFF;

-- Crear índices en Reservas
CREATE INDEX IX_Reservas_UsuarioID ON Reservas(UsuarioID);
CREATE INDEX IX_Reservas_LibroID ON Reservas(LibroID);
CREATE INDEX IX_Reservas_Estado ON Reservas(Estado);

-- 4. Crear nueva tabla Prestamos que se relacione con Reservas
CREATE TABLE Prestamos (
    PrestamoID INT IDENTITY(1,1) PRIMARY KEY,
    ReservaID INT NOT NULL,
    FechaPrestamo DATETIME DEFAULT GETDATE(),
    FechaVencimiento DATETIME NOT NULL,
    FechaDevolucion DATETIME NULL,
    Estado VARCHAR(20) DEFAULT 'Prestado',
    Renovaciones INT DEFAULT 0,
    Observaciones NVARCHAR(500) NULL
);

-- Agregar las constraints después de crear la tabla
ALTER TABLE Prestamos 
ADD CONSTRAINT FK_Prestamos_Reservas 
FOREIGN KEY (ReservaID) REFERENCES Reservas(ReservaID);

ALTER TABLE Prestamos 
ADD CONSTRAINT CK_Prestamos_Estado 
CHECK (Estado IN ('Prestado','Devuelto','Atrasado'));

-- 5. Modificar tabla Reservas para incluir el ejemplar y mejorar estados
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'CK_Reservas_Estado' AND type = 'C')
    ALTER TABLE Reservas DROP CONSTRAINT CK_Reservas_Estado;

ALTER TABLE Reservas
    ALTER COLUMN Estado VARCHAR(20) NOT NULL;

-- Agregar constraint de estado después de la modificación de la columna
ALTER TABLE Reservas
    ADD CONSTRAINT CK_Reservas_Estado 
    CHECK (Estado IN ('ColaEspera', 'PorAprobar', 'Aprobada', 'Completada', 'Cancelada', 'Expirada'));

-- 6. Agregar columnas necesarias en Reservas si no existen
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservas') AND name = 'EjemplarID')
BEGIN
    ALTER TABLE Reservas ADD EjemplarID INT NULL;
    ALTER TABLE Reservas ADD CONSTRAINT FK_Reservas_Ejemplares 
    FOREIGN KEY (EjemplarID) REFERENCES Ejemplares(EjemplarID);
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservas') AND name = 'EstadoNotificacion')
BEGIN
    ALTER TABLE Reservas ADD EstadoNotificacion VARCHAR(20) DEFAULT 'Pendiente';
    ALTER TABLE Reservas ADD CONSTRAINT CK_Reservas_EstadoNotificacion
    CHECK (EstadoNotificacion IN ('Pendiente', 'Enviada', 'Error'));
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Reservas') AND name = 'TipoReserva')
BEGIN
    ALTER TABLE Reservas ADD TipoReserva VARCHAR(20) DEFAULT 'ColaEspera';
    ALTER TABLE Reservas ADD CONSTRAINT CK_Reservas_TipoReserva
    CHECK (TipoReserva IN ('Retiro', 'ColaEspera'));
END

-- 7. Crear trigger para generar préstamo al aprobar reserva
GO
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_GenerarPrestamoAlAprobar')
    DROP TRIGGER TR_GenerarPrestamoAlAprobar;
GO

CREATE OR ALTER TRIGGER TR_GenerarPrestamoAlAprobar
ON Reservas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si una reserva pasa a estado Aprobada, generar préstamo
    INSERT INTO Prestamos (
        ReservaID,
        FechaPrestamo,
        FechaVencimiento,
        Estado
    )
    SELECT 
        i.ReservaID,
        GETDATE(),
        DATEADD(DAY, 7, GETDATE()), -- 7 días por defecto
        'Prestado'
    FROM inserted i
    INNER JOIN deleted d 
        ON i.ReservaID = d.ReservaID
        AND i.Estado = 'Aprobada' 
        AND d.Estado != 'Aprobada'
    WHERE NOT EXISTS (
        SELECT 1 FROM Prestamos p 
        WHERE p.ReservaID = i.ReservaID
    );

    -- Actualizar estado de reserva a Completada si se creó el préstamo
    UPDATE r
    SET Estado = 'Completada'
    FROM Reservas r
    INNER JOIN inserted i ON r.ReservaID = i.ReservaID
    WHERE i.Estado = 'Aprobada'
    AND EXISTS (
        SELECT 1 
        FROM Prestamos p 
        WHERE p.ReservaID = r.ReservaID
    );
END;
GO

-- 8. Crear índices para optimizar consultas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Prestamos_ReservaID')
    CREATE INDEX IX_Prestamos_ReservaID ON Prestamos(ReservaID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Reservas_Estado')
    CREATE INDEX IX_Reservas_Estado ON Reservas(Estado);

-- 9. Crear vista para facilitar consultas
GO
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VistaPrestamosCompleta')
    DROP VIEW VistaPrestamosCompleta;
GO

CREATE OR ALTER VIEW VistaPrestamosCompleta AS
SELECT 
    p.PrestamoID,
    p.FechaPrestamo,
    p.FechaVencimiento,
    p.FechaDevolucion,
    p.Estado AS EstadoPrestamo,
    p.Renovaciones,
    r.ReservaID,
    r.UsuarioID,
    r.LibroID,
    r.EjemplarID,
    r.Estado AS EstadoReserva,
    r.TipoReserva,
    u.Nombre AS NombreUsuario,
    u.CodigoUniversitario,
    l.Titulo AS LibroTitulo,
    l.ISBN,
    e.NumeroEjemplar,
    e.CodigoBarras
FROM Prestamos p
INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
INNER JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
INNER JOIN Libros l ON r.LibroID = l.LibroID
LEFT JOIN Ejemplares e ON r.EjemplarID = e.EjemplarID;
GO

PRINT 'Modificación de estructura completada. Recuerde actualizar la lógica de negocio en la aplicación.';