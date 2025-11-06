-- ===========================
-- BASE DE DATOS BIBLIOTECA FISI - MODELO SIMPLIFICADO
-- ===========================

-- Eliminar base de datos si existe
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'BibliotecaFISI')
    DROP DATABASE BibliotecaFISI;
GO

CREATE DATABASE BibliotecaFISI;
GO

USE BibliotecaFISI;
GO

-- Configurar opciones necesarias para campos calculados
SET QUOTED_IDENTIFIER ON;
GO

-- ===========================
-- TABLA: Usuarios
-- ===========================
CREATE TABLE Usuarios (
    UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
    CodigoUniversitario VARCHAR(20) UNIQUE NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    EmailInstitucional NVARCHAR(100) UNIQUE NOT NULL,
    ContrasenaHash NVARCHAR(200) NOT NULL,
    Rol VARCHAR(20) CHECK (Rol IN ('Estudiante','Profesor','Bibliotecaria','Administrador')),
    Estado BIT DEFAULT 1,
    FechaRegistro DATETIME DEFAULT GETDATE(),
    FechaUltimaActualizacionContrasena DATETIME DEFAULT GETDATE()
);

-- ===========================
-- TABLAS: Autores y Categorías
-- ===========================
CREATE TABLE Autores (
    AutorID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Biografia NVARCHAR(MAX),
    ORCID VARCHAR(20)
);

CREATE TABLE Categorias (
    CategoriaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) UNIQUE NOT NULL
);

-- ===========================
-- TABLA: Libros (datos bibliográficos) - SIMPLIFICADA
-- ===========================
CREATE TABLE Libros (
    LibroID INT IDENTITY(1,1) PRIMARY KEY,
    ISBN VARCHAR(20) NULL, -- ISBN opcional
    Titulo NVARCHAR(200) NOT NULL,
    Editorial NVARCHAR(100),
    AnioPublicacion INT,
    Idioma NVARCHAR(50),
    Paginas INT,
    -- TEMA ELIMINADO - Se usa solo LibroCategorias
    LCCSeccion VARCHAR(10), -- Ej: BC
    LCCNumero VARCHAR(20), -- Ej: 135 (puede tener decimales como 135.081)
    LCCCutter VARCHAR(20), -- Ej: .C78
    SignaturaLCC AS (LCCSeccion + ' ' + CAST(LCCNumero AS VARCHAR) + ' ' + LCCCutter + ' ' + CAST(AnioPublicacion AS VARCHAR)) PERSISTED -- Campo calculado
);

-- ===========================
-- RELACIONES N:M Libros-Autores y Libros-Categorías (normalizadas)
-- ===========================
CREATE TABLE LibroAutores (
    LibroID INT NOT NULL,
    AutorID INT NOT NULL,
    EsAutorPrincipal BIT DEFAULT 0,
    OrdenAutor INT DEFAULT 1,
    PRIMARY KEY (LibroID, AutorID),
    FOREIGN KEY (LibroID) REFERENCES Libros(LibroID),
    FOREIGN KEY (AutorID) REFERENCES Autores(AutorID)
);

CREATE TABLE LibroCategorias (
    LibroID INT NOT NULL,
    CategoriaID INT NOT NULL,
    EsCategoriaPrincipal BIT DEFAULT 0,
    PRIMARY KEY (LibroID, CategoriaID),
    FOREIGN KEY (LibroID) REFERENCES Libros(LibroID),
    FOREIGN KEY (CategoriaID) REFERENCES Categorias(CategoriaID)
);

-- ===========================
-- TABLA: Ejemplares (inventario físico)
-- ===========================
CREATE TABLE Ejemplares (
    EjemplarID INT IDENTITY(1,1) PRIMARY KEY,
    LibroID INT NOT NULL FOREIGN KEY REFERENCES Libros(LibroID),
    NumeroEjemplar INT NOT NULL, -- 1,2,3... único por libro
    CodigoBarras VARCHAR(50) UNIQUE NOT NULL, -- Único global
    Ubicacion NVARCHAR(100), -- Sala/estante/pasillo/nivel
    Estado VARCHAR(20) CHECK (Estado IN ('Disponible','Prestado','Reservado','Reparacion','Extraviado','Baja')) DEFAULT 'Disponible',
    FechaAlta DATETIME DEFAULT GETDATE(), -- Para auditoría
    Observaciones NVARCHAR(500) NULL, -- Notas del bibliotecario
    CONSTRAINT UK_Ejemplares_Libro_Numero UNIQUE (LibroID, NumeroEjemplar)
);
/*
    -- ===========================
    -- TABLA: Préstamos (circulación)
    -- ===========================
    CREATE TABLE Prestamos (
        PrestamoID INT IDENTITY(1,1) PRIMARY KEY,
        EjemplarID INT NOT NULL FOREIGN KEY REFERENCES Ejemplares(EjemplarID),
        UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
        FechaPrestamo DATETIME DEFAULT GETDATE(),
        FechaVencimiento DATETIME NOT NULL, -- FechaDevolucionPrevista
        FechaDevolucion DATETIME NULL, -- FechaDevolucionReal
        Estado VARCHAR(20) CHECK (Estado IN ('Prestado','Devuelto','Atrasado')) DEFAULT 'Prestado',
        Renovaciones INT DEFAULT 0,
        Observaciones NVARCHAR(500) NULL

    );
    */
-- ===========================
-- TABLA: Préstamos (circulación)
-- ===========================
CREATE TABLE Prestamos (
    PrestamoID INT IDENTITY(1,1) PRIMARY KEY,
    ReservaID INT NOT NULL FOREIGN KEY REFERENCES Reservas(ReservaID),
    
    FechaPrestamo DATETIME DEFAULT GETDATE(),
    FechaVencimiento DATETIME NOT NULL,
    FechaDevolucion DATETIME NULL,
    Estado VARCHAR(20) CHECK (Estado IN ('Prestado','Devuelto','Atrasado')) DEFAULT 'Prestado',
    Renovaciones INT DEFAULT 0,
    DiasRenovacion INT DEFAULT 0,
    Observaciones NVARCHAR(500) NULL,
    
    -- Auditoría
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaModificacion DATETIME DEFAULT GETDATE()
);

-- ===========================
-- TABLA: Multas (mejorada)
-- ===========================
CREATE TABLE Multas (
    MultaID INT IDENTITY(1,1) PRIMARY KEY,
    PrestamoID INT NOT NULL FOREIGN KEY REFERENCES Prestamos(PrestamoID),
    UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    Monto DECIMAL(10,2) NOT NULL,
    Estado VARCHAR(20) CHECK (Estado IN ('Pendiente','Pagada')) DEFAULT 'Pendiente',
    DiasAtraso INT NULL, -- Para cálculo automático
    Motivo NVARCHAR(200) NULL,
    FechaCobro DATETIME NULL
);

-- ===========================
-- TABLA: Reservas (por título)
-- ===========================
CREATE TABLE Reservas (
    ReservaID INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    LibroID INT NOT NULL FOREIGN KEY REFERENCES Libros(LibroID), -- Reserva por título, no por ejemplar
    FechaReserva DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(20) CHECK (Estado IN ('Activa','Cancelada','Atendida')) DEFAULT 'Activa',
    FechaExpiracion DATETIME NULL, -- Para reservas con vencimiento
    PrioridadCola INT DEFAULT 1 -- Para orden de atención
);

-- ===========================
-- TABLA: Recursos Digitales (para contenidos online)
-- ===========================
CREATE TABLE RecursosDigitales (
    RecursoID INT IDENTITY(1,1) PRIMARY KEY,
    LibroID INT NOT NULL FOREIGN KEY REFERENCES Libros(LibroID),
    URL NVARCHAR(255) NOT NULL,
    Tipo VARCHAR(20) CHECK (Tipo IN ('Gratuito','Suscripcion')),
    Plataforma NVARCHAR(100),
    Licencia NVARCHAR(100) NULL,
    Proveedor NVARCHAR(100) NULL,
    DRM VARCHAR(50) NULL -- Digital Rights Management
);

-- ===========================
-- TABLA: Recomendaciones
-- ===========================
CREATE TABLE Recomendaciones (
    RecomendacionID INT IDENTITY(1,1) PRIMARY KEY,
    ProfesorID INT NOT NULL FOREIGN KEY REFERENCES Usuarios(UsuarioID),
    Curso NVARCHAR(100) NOT NULL,
    LibroID INT NULL FOREIGN KEY REFERENCES Libros(LibroID),
    URLExterna NVARCHAR(255) NULL,
    Fecha DATETIME DEFAULT GETDATE()
);

-- ===========================
-- ÍNDICES PARA CONSULTAS FRECUENTES
-- ===========================

-- Índices para búsquedas rápidas
CREATE INDEX IX_Libros_ISBN ON Libros(ISBN);
CREATE INDEX IX_Libros_Titulo ON Libros(Titulo);
CREATE INDEX IX_Libros_SignaturaLCC ON Libros(SignaturaLCC);

-- Índices para ejemplares
CREATE INDEX IX_Ejemplares_CodigoBarras ON Ejemplares(CodigoBarras);
CREATE INDEX IX_Ejemplares_LibroID ON Ejemplares(LibroID);
CREATE INDEX IX_Ejemplares_Estado ON Ejemplares(Estado);

-- Índices para préstamos
CREATE INDEX IX_Prestamos_UsuarioID ON Prestamos(UsuarioID);
CREATE INDEX IX_Prestamos_EjemplarID ON Prestamos(EjemplarID);
CREATE INDEX IX_Prestamos_Estado ON Prestamos(Estado);
CREATE INDEX IX_Prestamos_FechaVencimiento ON Prestamos(FechaVencimiento);

-- Índices para reservas
CREATE INDEX IX_Reservas_UsuarioID ON Reservas(UsuarioID);
CREATE INDEX IX_Reservas_LibroID ON Reservas(LibroID);
CREATE INDEX IX_Reservas_Estado ON Reservas(Estado);

-- Índices para multas
CREATE INDEX IX_Multas_UsuarioID ON Multas(UsuarioID);
CREATE INDEX IX_Multas_Estado ON Multas(Estado);

-- Índices para usuarios
CREATE INDEX IX_Usuarios_CodigoUniversitario ON Usuarios(CodigoUniversitario);
CREATE INDEX IX_Usuarios_EmailInstitucional ON Usuarios(EmailInstitucional);

-- Índices para autores
CREATE INDEX IX_Autores_ORCID ON Autores(ORCID);
CREATE INDEX IX_Autores_Nombre ON Autores(Nombre);

-- ===========================
-- VISTAS ÚTILES
-- ===========================
GO

-- Vista para disponibilidad de libros
CREATE VIEW VistaDisponibilidadLibros AS
SELECT 
    l.LibroID,
    l.Titulo,
    l.ISBN,
    l.SignaturaLCC,
    COUNT(e.EjemplarID) as TotalEjemplares,
    COUNT(CASE WHEN e.Estado = 'Disponible' THEN 1 END) as EjemplaresDisponibles
FROM Libros l
LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
WHERE e.Estado != 'Baja' OR e.Estado IS NULL
GROUP BY l.LibroID, l.Titulo, l.ISBN, l.SignaturaLCC;
GO

-- Vista para préstamos activos
CREATE VIEW VistaPrestamosActivos AS
SELECT 
    p.PrestamoID,
    p.FechaPrestamo,
    p.FechaVencimiento,
    p.Renovaciones,
    u.Nombre as UsuarioNombre,
    u.CodigoUniversitario,
    l.Titulo as LibroTitulo,
    l.ISBN,
    e.NumeroEjemplar,
    e.CodigoBarras,
    CASE 
        WHEN p.FechaVencimiento < GETDATE() THEN 'Atrasado'
        ELSE 'Prestado'
    END as EstadoCalculado
FROM Prestamos p
INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
INNER JOIN Libros l ON e.LibroID = l.LibroID
WHERE p.Estado = 'Prestado';

-- ===========================
-- PROCEDIMIENTO SIMPLIFICADO PARA INSERTAR LIBRO
-- ===========================
GO

-- Procedimiento simplificado que recibe las partes LCC ya separadas
CREATE PROCEDURE sp_InsertarLibroConLCC
    @Titulo NVARCHAR(200),
    @Autor NVARCHAR(100),
    @ORCID VARCHAR(20) = NULL,
    @LCCSeccion VARCHAR(10),      -- RECIBE SECCIÓN YA SEPARADA
    @LCCNumero VARCHAR(20),       -- RECIBE NÚMERO YA SEPARADO
    @LCCCutter VARCHAR(20),      -- RECIBE CUTTER YA SEPARADO
    @AnioPublicacion INT = NULL,
    @Editorial NVARCHAR(100) = NULL,
    @Idioma NVARCHAR(50) = 'Español'
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insertar libro
        INSERT INTO Libros (ISBN, Titulo, Editorial, AnioPublicacion, Idioma, Paginas, LCCSeccion, LCCNumero, LCCCutter)
        VALUES (NULL, @Titulo, @Editorial, @AnioPublicacion, @Idioma, NULL, @LCCSeccion, @LCCNumero, @LCCCutter);
        
        DECLARE @LibroID INT = SCOPE_IDENTITY();
        
        -- Insertar o encontrar autor (mejorado con ORCID)
        DECLARE @AutorID INT;
        
        -- Buscar por ORCID primero si se proporciona
        IF @ORCID IS NOT NULL AND @ORCID != ''
        BEGIN
            IF EXISTS (SELECT 1 FROM Autores WHERE ORCID = @ORCID)
            BEGIN
                SELECT @AutorID = AutorID FROM Autores WHERE ORCID = @ORCID;
            END
            ELSE
            BEGIN
                -- Crear nuevo autor con ORCID
                INSERT INTO Autores (Nombre, ORCID) VALUES (@Autor, @ORCID);
                SET @AutorID = SCOPE_IDENTITY();
            END
        END
        ELSE
        BEGIN
            -- Buscar solo por nombre si no hay ORCID
            IF EXISTS (SELECT 1 FROM Autores WHERE Nombre = @Autor)
            BEGIN
                SELECT @AutorID = AutorID FROM Autores WHERE Nombre = @Autor;
            END
            ELSE
            BEGIN
                -- Crear nuevo autor sin ORCID
                INSERT INTO Autores (Nombre) VALUES (@Autor);
                SET @AutorID = SCOPE_IDENTITY();
            END
        END
        
        -- Crear relación libro-autor
        INSERT INTO LibroAutores (LibroID, AutorID, EsAutorPrincipal, OrdenAutor)
        VALUES (@LibroID, @AutorID, 1, 1);
        
        -- Insertar o encontrar categoría basada en LCC
        DECLARE @CategoriaID INT;
        DECLARE @NombreCategoria NVARCHAR(100);
        
        SET @NombreCategoria = CASE @LCCSeccion
            WHEN 'BC' THEN 'Filosofía y Lógica'
            WHEN 'BF' THEN 'Psicología'
            WHEN 'G' THEN 'Geografía y Antropología'
            WHEN 'GV' THEN 'Recreación y Deportes'
            WHEN 'H' THEN 'Ciencias Sociales'
            WHEN 'HA' THEN 'Estadística'
            WHEN 'HB' THEN 'Economía'
            WHEN 'HC' THEN 'Historia Económica'
            WHEN 'HD' THEN 'Industria y Trabajo'
            WHEN 'HF' THEN 'Comercio'
            WHEN 'QA' THEN 'Matemáticas y Computación'
            WHEN 'QB' THEN 'Astronomía'
            WHEN 'QC' THEN 'Física'
            WHEN 'QD' THEN 'Química'
            WHEN 'QE' THEN 'Geología'
            WHEN 'QH' THEN 'Biología'
            WHEN 'QK' THEN 'Botánica'
            WHEN 'QL' THEN 'Zoología'
            WHEN 'QM' THEN 'Anatomía Humana'
            WHEN 'QP' THEN 'Fisiología'
            WHEN 'QR' THEN 'Microbiología'
            WHEN 'TS' THEN 'Manufactura y Calidad'
            WHEN 'TR' THEN 'Tecnología y Multimedia'
            WHEN 'Z' THEN 'Bibliotecología e Información'
            ELSE 'General'
        END;
        
        IF NOT EXISTS (SELECT 1 FROM Categorias WHERE Nombre = @NombreCategoria)
        BEGIN
            INSERT INTO Categorias (Nombre) VALUES (@NombreCategoria);
            SET @CategoriaID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            SELECT @CategoriaID = CategoriaID FROM Categorias WHERE Nombre = @NombreCategoria;
        END
        
        -- Crear relación libro-categoría
        INSERT INTO LibroCategorias (LibroID, CategoriaID, EsCategoriaPrincipal)
        VALUES (@LibroID, @CategoriaID, 1);
        
        COMMIT TRANSACTION;
        
        SELECT 'Libro insertado exitosamente' AS Resultado, @LibroID AS LibroID;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 'Error: ' + ERROR_MESSAGE() AS Resultado;
    END CATCH
END;
GO

-- ===========================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- ===========================
GO

-- Trigger para actualizar estado de préstamos atrasados
CREATE TRIGGER TR_ActualizarPrestamosAtrasados
ON Prestamos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Prestamos 
    SET Estado = 'Atrasado'
    WHERE PrestamoID IN (
        SELECT PrestamoID 
        FROM inserted 
        WHERE Estado = 'Prestado' 
        AND FechaVencimiento < GETDATE()
    );
END;
GO

-- Trigger para generar multas automáticamente
CREATE TRIGGER TR_GenerarMultaAutomatica
ON Prestamos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Generar multa cuando un préstamo se marca como atrasado
    INSERT INTO Multas (PrestamoID, UsuarioID, Monto, Estado, DiasAtraso, Motivo)
    SELECT 
        i.PrestamoID,
        i.UsuarioID,
        DATEDIFF(day, i.FechaVencimiento, GETDATE()) * 2.50, -- S/2.50 por día
        'Pendiente',
        DATEDIFF(day, i.FechaVencimiento, GETDATE()),
        'Retraso en devolución'
    FROM inserted i
    INNER JOIN deleted d ON i.PrestamoID = d.PrestamoID
    WHERE i.Estado = 'Atrasado' 
    AND d.Estado != 'Atrasado'
    AND NOT EXISTS (
        SELECT 1 FROM Multas m 
        WHERE m.PrestamoID = i.PrestamoID 
        AND m.Estado = 'Pendiente'
    );
END;

-- ===========================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ===========================
GO

-- Procedimiento para calcular disponibilidad de un libro
CREATE PROCEDURE SP_CalcularDisponibilidadLibro
    @LibroID INT
AS
BEGIN
    SELECT 
        l.Titulo,
        l.ISBN,
        COUNT(e.EjemplarID) as TotalEjemplares,
        COUNT(CASE WHEN e.Estado = 'Disponible' THEN 1 END) as EjemplaresDisponibles,
        COUNT(CASE WHEN e.Estado = 'Prestado' THEN 1 END) as EjemplaresPrestados,
        COUNT(CASE WHEN e.Estado = 'Reservado' THEN 1 END) as EjemplaresReservados
    FROM Libros l
    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
    WHERE l.LibroID = @LibroID
    AND (e.Estado != 'Baja' OR e.Estado IS NULL)
    GROUP BY l.LibroID, l.Titulo, l.ISBN;
END;
GO

-- Procedimiento para procesar devolución
CREATE PROCEDURE SP_ProcesarDevolucion
    @PrestamoID INT,
    @Observaciones NVARCHAR(500) = NULL
AS
BEGIN
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Actualizar préstamo
        UPDATE Prestamos 
        SET Estado = 'Devuelto',
            FechaDevolucion = GETDATE(),
            Observaciones = @Observaciones
        WHERE PrestamoID = @PrestamoID;
        
        -- Actualizar ejemplar
        UPDATE Ejemplares 
        SET Estado = 'Disponible'
        WHERE EjemplarID = (
            SELECT EjemplarID FROM Prestamos WHERE PrestamoID = @PrestamoID
        );
        
        -- Atender reserva si existe (la primera en la cola)
        UPDATE TOP(1) Reservas 
        SET Estado = 'Atendida'
        WHERE LibroID = (
            SELECT e.LibroID 
            FROM Prestamos p
            INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
            WHERE p.PrestamoID = @PrestamoID
        )
        AND Estado = 'Activa'
        AND ReservaID = (
            SELECT TOP(1) ReservaID 
            FROM Reservas r2 
            WHERE r2.LibroID = (
                SELECT e.LibroID 
                FROM Prestamos p
                INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
                WHERE p.PrestamoID = @PrestamoID
            )
            AND r2.Estado = 'Activa'
            ORDER BY r2.FechaReserva ASC
        );
        
        COMMIT TRANSACTION;
        SELECT 'Devolución procesada exitosamente' as Resultado;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 'Error al procesar devolución: ' + ERROR_MESSAGE() as Resultado;
    END CATCH;
END;

PRINT 'Base de datos BibliotecaFISI SIMPLIFICADA creada exitosamente';
PRINT 'Mejoras implementadas:';
PRINT '- Función LCC compleja eliminada';
PRINT '- SP simplificado que recibe partes LCC separadas';
PRINT '- Lógica de parsing movida a Python';
PRINT '- Base de datos limpia y optimizada';

-- ===========================
-- BASE DE DATOS LISTA PARA MIGRACIÓN CON PYTHON
-- ===========================
