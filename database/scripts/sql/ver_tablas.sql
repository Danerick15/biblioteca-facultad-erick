-- =============================================
-- Script para ver todas las tablas de la base de datos
-- Muestra información de tablas, columnas y cantidad de registros
-- =============================================
-- IMPORTANTE: Este script genera resultados en DOS pestañas:
-- 1. Pestaña "Resultados": Contiene las consultas SELECT con datos de las tablas
-- 2. Pestaña "Mensajes": Contiene los mensajes PRINT y errores
-- Asegúrate de revisar AMBAS pestañas para ver toda la información
-- =============================================

USE BibliotecaFISI;
GO

-- Limpiar tablas temporales de ejecuciones anteriores
IF OBJECT_ID('tempdb..#TablasInfo') IS NOT NULL
    DROP TABLE #TablasInfo;

-- Asegurar que estamos en la base de datos correcta
IF DB_NAME() != 'BibliotecaFISI'
BEGIN
    PRINT 'ERROR: No se está usando la base de datos BibliotecaFISI';
    PRINT 'Por favor, ejecuta: USE BibliotecaFISI; antes de este script';
    RETURN;
END

PRINT '========================================';
PRINT 'TABLAS EN LA BASE DE DATOS: ' + DB_NAME();
PRINT '========================================';
PRINT '';

-- Obtener todas las tablas del esquema dbo
SELECT 
    t.name AS NombreTabla,
    (
        SELECT COUNT(*) 
        FROM sys.columns c 
        WHERE c.object_id = t.object_id
    ) AS CantidadColumnas,
    (
        SELECT COUNT(*) 
        FROM sys.indexes i 
        WHERE i.object_id = t.object_id AND i.type > 0
    ) AS CantidadIndices,
    CASE 
        WHEN t.name IN ('Usuarios', 'Libros', 'Ejemplares', 'Prestamos', 'Autores', 'Categorias', 
                       'LibroAutores', 'LibroCategorias', 'Reservas', 'Multas', 'Notificaciones')
        THEN 'Sistema'
        ELSE 'Usuario'
    END AS TipoTabla
INTO #TablasInfo
FROM sys.tables t
WHERE t.schema_id = SCHEMA_ID('dbo')
ORDER BY t.name;

-- Mostrar información general de tablas
SELECT 
    NombreTabla,
    CantidadColumnas,
    CantidadIndices,
    TipoTabla
FROM #TablasInfo
ORDER BY TipoTabla, NombreTabla;

PRINT '';
PRINT '========================================';
PRINT 'DETALLE DE REGISTROS POR TABLA';
PRINT '========================================';
PRINT '';

-- Crear tabla temporal para almacenar resultados
DECLARE @TablaInfo TABLE (
    NombreTabla NVARCHAR(128),
    CantidadRegistros INT,
    TieneDatos BIT
);

-- Obtener cantidad de registros de cada tabla dinámicamente
DECLARE @TablaName NVARCHAR(128);
DECLARE @SQL NVARCHAR(MAX);
DECLARE @Count INT;

DECLARE tabla_cursor CURSOR FOR
SELECT NombreTabla FROM #TablasInfo ORDER BY NombreTabla;

OPEN tabla_cursor;
FETCH NEXT FROM tabla_cursor INTO @TablaName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = N'SELECT @Count = COUNT(*) FROM [' + @TablaName + ']';
    BEGIN TRY
        EXEC sp_executesql @SQL, N'@Count INT OUTPUT', @Count OUTPUT;
        INSERT INTO @TablaInfo (NombreTabla, CantidadRegistros, TieneDatos)
        VALUES (@TablaName, @Count, CASE WHEN @Count > 0 THEN 1 ELSE 0 END);
    END TRY
    BEGIN CATCH
        INSERT INTO @TablaInfo (NombreTabla, CantidadRegistros, TieneDatos)
        VALUES (@TablaName, -1, 0);
    END CATCH
    
    FETCH NEXT FROM tabla_cursor INTO @TablaName;
END;

CLOSE tabla_cursor;
DEALLOCATE tabla_cursor;

-- Mostrar resultados
SELECT 
    t.NombreTabla,
    CASE 
        WHEN ti.CantidadRegistros = -1 THEN 'Error al consultar'
        ELSE CAST(ti.CantidadRegistros AS NVARCHAR(20))
    END AS CantidadRegistros,
    CASE 
        WHEN ti.CantidadRegistros = -1 THEN '❌'
        WHEN ti.TieneDatos = 1 THEN '✅'
        ELSE '⚪'
    END AS Estado,
    t.CantidadColumnas,
    t.CantidadIndices,
    t.TipoTabla
FROM #TablasInfo t
LEFT JOIN @TablaInfo ti ON t.NombreTabla = ti.NombreTabla
ORDER BY t.TipoTabla, t.NombreTabla;

PRINT '';
PRINT '========================================';
PRINT 'RESUMEN';
PRINT '========================================';

SELECT 
    COUNT(*) AS TotalTablas,
    SUM(CASE WHEN ti.CantidadRegistros > 0 THEN 1 ELSE 0 END) AS TablasConDatos,
    SUM(CASE WHEN ti.CantidadRegistros = 0 THEN 1 ELSE 0 END) AS TablasVacias,
    SUM(CASE WHEN t.TipoTabla = 'Sistema' THEN 1 ELSE 0 END) AS TablasSistema,
    SUM(CASE WHEN t.TipoTabla = 'Usuario' THEN 1 ELSE 0 END) AS TablasUsuario
FROM #TablasInfo t
LEFT JOIN @TablaInfo ti ON t.NombreTabla = ti.NombreTabla;

PRINT '';
PRINT '========================================';
PRINT 'COLUMNAS DE CADA TABLA';
PRINT '========================================';
PRINT '';

-- Mostrar columnas de cada tabla
SELECT 
    t.name AS Tabla,
    c.name AS Columna,
    ty.name AS TipoDato,
    c.max_length AS LongitudMaxima,
    c.is_nullable AS PermiteNull,
    CASE 
        WHEN c.is_identity = 1 THEN 'SÍ'
        ELSE 'NO'
    END AS EsIdentity,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM sys.key_constraints kc
            INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
            WHERE kc.parent_object_id = c.object_id 
            AND kc.type = 'PK'
            AND ic.column_id = c.column_id
        ) THEN 'SÍ'
        ELSE 'NO'
    END AS ClavePrimaria
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.schema_id = SCHEMA_ID('dbo')
ORDER BY t.name, c.column_id;

PRINT '';
PRINT '========================================';
PRINT 'RELACIONES ENTRE TABLAS (FOREIGN KEYS)';
PRINT '========================================';
PRINT '';

-- Mostrar relaciones entre tablas
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TablaOrigen,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnaOrigen,
    OBJECT_NAME(f.referenced_object_id) AS TablaReferenciada,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ColumnaReferenciada,
    f.name AS NombreConstraint
FROM sys.foreign_keys f
INNER JOIN sys.foreign_key_columns fc ON f.object_id = fc.constraint_object_id
WHERE OBJECT_SCHEMA_NAME(f.parent_object_id) = 'dbo'
ORDER BY TablaOrigen, ColumnaOrigen;

PRINT '';
PRINT '========================================';
PRINT 'DATOS DE CADA TABLA';
PRINT '========================================';
PRINT 'NOTA: Si una tabla tiene muchos registros, se mostrarán limitados';
PRINT '';

-- Mostrar datos de cada tabla dinámicamente
DECLARE @TablaName2 NVARCHAR(128);
DECLARE @SQL2 NVARCHAR(MAX);
DECLARE @Count2 INT;
DECLARE @MaxRows INT = 100; -- Limitar a 100 registros por tabla para no saturar

DECLARE tabla_cursor2 CURSOR FOR
SELECT NombreTabla FROM #TablasInfo ORDER BY NombreTabla;

OPEN tabla_cursor2;
FETCH NEXT FROM tabla_cursor2 INTO @TablaName2;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Obtener cantidad de registros
    SET @SQL2 = N'SELECT @Count = COUNT(*) FROM [' + @TablaName2 + ']';
    BEGIN TRY
        EXEC sp_executesql @SQL2, N'@Count INT OUTPUT', @Count2 OUTPUT;
        
        IF @Count2 > 0
        BEGIN
            PRINT '';
            PRINT '========================================';
            PRINT 'TABLA: ' + @TablaName2 + ' (' + CAST(@Count2 AS NVARCHAR(20)) + ' registros)';
            PRINT '========================================';
            
            -- Si hay más de @MaxRows registros, mostrar solo los primeros
            IF @Count2 > @MaxRows
            BEGIN
                SET @SQL2 = N'SELECT TOP ' + CAST(@MaxRows AS NVARCHAR(10)) + ' * FROM [' + @TablaName2 + ']';
                PRINT 'NOTA: Mostrando solo los primeros ' + CAST(@MaxRows AS NVARCHAR(10)) + ' registros de ' + CAST(@Count2 AS NVARCHAR(20));
            END
            ELSE
            BEGIN
                SET @SQL2 = N'SELECT * FROM [' + @TablaName2 + ']';
            END
            
            -- Ejecutar consulta para mostrar datos
            -- NOTA: Los resultados aparecerán en la pestaña "Resultados"
            EXEC sp_executesql @SQL2;
        END
        ELSE
        BEGIN
            PRINT '';
            PRINT 'TABLA: ' + @TablaName2 + ' - ⚪ VACÍA';
        END
    END TRY
    BEGIN CATCH
        PRINT '';
        PRINT 'TABLA: ' + @TablaName2 + ' - ❌ Error al consultar: ' + ERROR_MESSAGE();
    END CATCH
    
    FETCH NEXT FROM tabla_cursor2 INTO @TablaName2;
END;

CLOSE tabla_cursor2;
DEALLOCATE tabla_cursor2;

-- Limpiar tabla temporal
DROP TABLE #TablasInfo;

PRINT '';
PRINT '========================================';
PRINT 'CONSULTAS ESPECÍFICAS POR TABLA';
PRINT '========================================';
PRINT '';

-- Consulta específica para Usuarios
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- USUARIOS ---';
    SELECT 
        UsuarioID,
        CodigoUniversitario,
        Nombre,
        EmailInstitucional,
        Rol,
        CASE WHEN Estado = 1 THEN 'Activo' ELSE 'Inactivo' END AS Estado,
        FechaRegistro
    FROM Usuarios
    ORDER BY UsuarioID;
    PRINT '';
END

-- Consulta específica para Libros
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Libros' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- LIBROS ---';
    SELECT 
        LibroID,
        Titulo,
        ISBN,
        Editorial,
        AnioPublicacion,
        SignaturaLCC
    FROM Libros
    ORDER BY LibroID;
    PRINT '';
END

-- Consulta específica para Ejemplares
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Ejemplares' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- EJEMPLARES ---';
    SELECT 
        EjemplarID,
        LibroID,
        NumeroEjemplar,
        CodigoBarras,
        Estado,
        Ubicacion
    FROM Ejemplares
    ORDER BY EjemplarID;
    PRINT '';
END

-- Consulta específica para Autores
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Autores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- AUTORES ---';
    SELECT 
        AutorID,
        Nombre,
        ORCID
    FROM Autores
    ORDER BY AutorID;
    PRINT '';
END

-- Consulta específica para Categorias
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Categorias' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- CATEGORÍAS ---';
    SELECT 
        CategoriaID,
        Nombre
    FROM Categorias
    ORDER BY CategoriaID;
    PRINT '';
END

-- Consulta específica para Prestamos
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Prestamos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- PRÉSTAMOS ---';
    SELECT 
        PrestamoID,
        ReservaID,
        FechaPrestamo,
        FechaVencimiento,
        FechaDevolucion,
        Estado,
        Renovaciones
    FROM Prestamos
    ORDER BY PrestamoID DESC;
    PRINT '';
END

-- Consulta específica para Reservas
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservas' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- RESERVAS ---';
    SELECT 
        ReservaID,
        UsuarioID,
        LibroID,
        EjemplarID,
        FechaReserva,
        Estado,
        TipoReserva,
        PrioridadCola
    FROM Reservas
    ORDER BY ReservaID DESC;
    PRINT '';
END

-- Consulta específica para Multas
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Multas' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- MULTAS ---';
    SELECT 
        MultaID,
        PrestamoID,
        UsuarioID,
        Monto,
        Estado,
        DiasAtraso,
        FechaCobro
    FROM Multas
    ORDER BY MultaID DESC;
    PRINT '';
END

-- Consulta específica para Notificaciones
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notificaciones' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- NOTIFICACIONES ---';
    SELECT 
        NotificacionID,
        ReservaID,
        UsuarioID,
        Tipo,
        Mensaje,
        FechaCreacion,
        Estado
    FROM Notificaciones
    ORDER BY NotificacionID DESC;
    PRINT '';
END

-- Consulta específica para LibroAutores (relación)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LibroAutores' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- LIBRO-AUTORES (Relación) ---';
    SELECT 
        la.LibroID,
        l.Titulo AS Libro,
        la.AutorID,
        a.Nombre AS Autor,
        CASE WHEN la.EsAutorPrincipal = 1 THEN 'Sí' ELSE 'No' END AS EsPrincipal,
        la.OrdenAutor
    FROM LibroAutores la
    LEFT JOIN Libros l ON la.LibroID = l.LibroID
    LEFT JOIN Autores a ON la.AutorID = a.AutorID
    ORDER BY la.LibroID, la.OrdenAutor;
    PRINT '';
END

-- Consulta específica para LibroCategorias (relación)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'LibroCategorias' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- LIBRO-CATEGORÍAS (Relación) ---';
    SELECT 
        lc.LibroID,
        l.Titulo AS Libro,
        lc.CategoriaID,
        c.Nombre AS Categoria,
        CASE WHEN lc.EsCategoriaPrincipal = 1 THEN 'Sí' ELSE 'No' END AS EsPrincipal
    FROM LibroCategorias lc
    LEFT JOIN Libros l ON lc.LibroID = l.LibroID
    LEFT JOIN Categorias c ON lc.CategoriaID = c.CategoriaID
    ORDER BY lc.LibroID;
    PRINT '';
END

-- Consulta resumen: Libros con ejemplares disponibles
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Libros' AND schema_id = SCHEMA_ID('dbo'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Ejemplares' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- RESUMEN: LIBROS Y DISPONIBILIDAD ---';
    SELECT 
        l.LibroID,
        l.Titulo,
        l.ISBN,
        COUNT(e.EjemplarID) AS TotalEjemplares,
        SUM(CASE WHEN e.Estado = 'Disponible' THEN 1 ELSE 0 END) AS Disponibles,
        SUM(CASE WHEN e.Estado = 'Prestado' THEN 1 ELSE 0 END) AS Prestados,
        SUM(CASE WHEN e.Estado = 'Reservado' THEN 1 ELSE 0 END) AS Reservados
    FROM Libros l
    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
    GROUP BY l.LibroID, l.Titulo, l.ISBN
    ORDER BY l.Titulo;
    PRINT '';
END

-- Consulta resumen: Usuarios con préstamos activos
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios' AND schema_id = SCHEMA_ID('dbo'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Prestamos' AND schema_id = SCHEMA_ID('dbo'))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservas' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT '--- RESUMEN: USUARIOS CON PRÉSTAMOS ACTIVOS ---';
    SELECT 
        u.UsuarioID,
        u.CodigoUniversitario,
        u.Nombre,
        u.Rol,
        COUNT(p.PrestamoID) AS PrestamosActivos,
        SUM(CASE WHEN p.FechaVencimiento < GETDATE() THEN 1 ELSE 0 END) AS PrestamosAtrasados
    FROM Usuarios u
    INNER JOIN Reservas r ON u.UsuarioID = r.UsuarioID
    INNER JOIN Prestamos p ON r.ReservaID = p.ReservaID
    WHERE p.Estado = 'Prestado'
    GROUP BY u.UsuarioID, u.CodigoUniversitario, u.Nombre, u.Rol
    ORDER BY PrestamosActivos DESC;
    PRINT '';
END

PRINT '';
PRINT '========================================';
PRINT 'Script completado exitosamente';
PRINT '========================================';
GO

