-- ============================================
-- Script para agregar soporte de libros digitales
-- HU-10: Acceso a libros digitales
-- ============================================
USE BibliotecaFISI;
GO

-- Verificar si las columnas ya existen antes de agregarlas
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Libros]') AND name = 'RutaArchivoDigital')
BEGIN
    ALTER TABLE [dbo].[Libros]
    ADD [RutaArchivoDigital] NVARCHAR(500) NULL,
        [TipoArchivoDigital] VARCHAR(20) NULL,
        [TamañoArchivoDigital] BIGINT NULL,
        [FechaSubidaDigital] DATETIME NULL,
        [ContadorVistas] INT DEFAULT 0,
        [ContadorDescargas] INT DEFAULT 0;
    
    PRINT 'Columnas agregadas a la tabla Libros correctamente.';
END
ELSE
BEGIN
    PRINT 'Las columnas ya existen en la tabla Libros.';
END
GO

-- Crear tabla de logs de acceso a archivos digitales
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LogsAccesoDigital')
BEGIN
    CREATE TABLE [dbo].[LogsAccesoDigital] (
        [LogID] INT IDENTITY(1,1) PRIMARY KEY,
        [LibroID] INT NOT NULL,
        [UsuarioID] INT NOT NULL,
        [TipoAcceso] VARCHAR(20) NOT NULL CHECK (TipoAcceso IN ('Vista', 'Descarga')),
        [FechaAcceso] DATETIME DEFAULT GETDATE(),
        [IPAcceso] VARCHAR(50) NULL,
        [UserAgent] NVARCHAR(500) NULL,
        FOREIGN KEY ([LibroID]) REFERENCES [dbo].[Libros]([LibroID]) ON DELETE CASCADE,
        FOREIGN KEY ([UsuarioID]) REFERENCES [dbo].[Usuarios]([UsuarioID]) ON DELETE CASCADE
    );
    
    -- Índice para mejorar consultas por libro y usuario
    CREATE INDEX IX_LogsAccesoDigital_LibroID ON [dbo].[LogsAccesoDigital]([LibroID]);
    CREATE INDEX IX_LogsAccesoDigital_UsuarioID ON [dbo].[LogsAccesoDigital]([UsuarioID]);
    CREATE INDEX IX_LogsAccesoDigital_FechaAcceso ON [dbo].[LogsAccesoDigital]([FechaAcceso]);
    
    PRINT 'Tabla LogsAccesoDigital creada correctamente.';
END
ELSE
BEGIN
    PRINT 'La tabla LogsAccesoDigital ya existe.';
END
GO

PRINT 'Script completado exitosamente.';
GO

