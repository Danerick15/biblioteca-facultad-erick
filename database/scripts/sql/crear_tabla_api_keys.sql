-- Script para crear tabla de API Keys para la API pública
-- Ejecutar en SQL Server Management Studio

USE BibliotecaFISI;
GO

-- Crear tabla ApiKeys si no existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApiKeys' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[ApiKeys](
        [ApiKeyID] [int] IDENTITY(1,1) NOT NULL,
        [ApiKey] [nvarchar](100) NOT NULL,
        [Nombre] [nvarchar](100) NOT NULL,
        [Descripcion] [nvarchar](500) NULL,
        [Activa] [bit] NOT NULL DEFAULT 1,
        [FechaCreacion] [datetime] NOT NULL DEFAULT GETDATE(),
        [FechaUltimoUso] [datetime] NULL,
        [ContadorUso] [int] NOT NULL DEFAULT 0,
        [LimiteUsoDiario] [int] NULL, -- NULL = sin límite
        [CreadoPor] [int] NULL, -- UsuarioID del administrador que la creó
        CONSTRAINT [PK_ApiKeys] PRIMARY KEY CLUSTERED ([ApiKeyID] ASC),
        CONSTRAINT [UK_ApiKeys_ApiKey] UNIQUE NONCLUSTERED ([ApiKey] ASC)
    );
    
    CREATE INDEX [IX_ApiKeys_ApiKey] ON [dbo].[ApiKeys]([ApiKey]);
    CREATE INDEX [IX_ApiKeys_Activa] ON [dbo].[ApiKeys]([Activa]);
    
    PRINT 'Tabla ApiKeys creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla ApiKeys ya existe.';
END
GO

-- Crear tabla de logs de uso de API (opcional pero recomendado)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApiKeyLogs' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[ApiKeyLogs](
        [LogID] [bigint] IDENTITY(1,1) NOT NULL,
        [ApiKeyID] [int] NOT NULL,
        [Endpoint] [nvarchar](200) NOT NULL,
        [Metodo] [nvarchar](10) NOT NULL,
        [IPAddress] [nvarchar](50) NULL,
        [UserAgent] [nvarchar](500) NULL,
        [FechaAcceso] [datetime] NOT NULL DEFAULT GETDATE(),
        [RespuestaHTTP] [int] NULL,
        CONSTRAINT [PK_ApiKeyLogs] PRIMARY KEY CLUSTERED ([LogID] ASC),
        CONSTRAINT [FK_ApiKeyLogs_ApiKeys] FOREIGN KEY([ApiKeyID]) 
            REFERENCES [dbo].[ApiKeys]([ApiKeyID]) ON DELETE CASCADE
    );
    
    CREATE INDEX [IX_ApiKeyLogs_ApiKeyID] ON [dbo].[ApiKeyLogs]([ApiKeyID]);
    CREATE INDEX [IX_ApiKeyLogs_FechaAcceso] ON [dbo].[ApiKeyLogs]([FechaAcceso]);
    
    PRINT 'Tabla ApiKeyLogs creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla ApiKeyLogs ya existe.';
END
GO

-- Crear una API Key de prueba (opcional)
-- NOTA: En producción, las API keys deben generarse de forma segura
IF NOT EXISTS (SELECT 1 FROM ApiKeys WHERE ApiKey = 'test-api-key-12345')
BEGIN
    INSERT INTO ApiKeys (ApiKey, Nombre, Descripcion, Activa, CreadoPor)
    VALUES ('test-api-key-12345', 'API Key de Prueba', 'API Key para desarrollo y pruebas', 1, NULL);
    
    PRINT 'API Key de prueba creada: test-api-key-12345';
END
GO

PRINT 'Script completado exitosamente.';
GO


