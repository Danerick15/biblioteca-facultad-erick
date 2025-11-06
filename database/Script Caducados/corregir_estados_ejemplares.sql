-- Script para corregir estados de ejemplares que están marcados como "Prestado" 
-- pero que en realidad ya fueron devueltos (no tienen préstamos activos)

-- Asegurarse de usar la base de datos correcta
USE BibliotecaFISI;
GO

-- Primero, identificar ejemplares que están marcados como "Prestado" pero no tienen préstamos activos
-- y actualizarlos a "Disponible"
UPDATE [dbo].[Ejemplares]
SET Estado = 'Disponible'
WHERE Estado = 'Prestado'
AND EjemplarID NOT IN (
    -- Ejemplares que tienen préstamos activos (Estado = 'Prestado')
    SELECT DISTINCT r.EjemplarID
    FROM [dbo].[Prestamos] p
    INNER JOIN [dbo].[Reservas] r ON p.ReservaID = r.ReservaID
    WHERE p.Estado = 'Prestado'
    AND r.EjemplarID IS NOT NULL
);
GO

-- También corregir ejemplares que están marcados como "Reservado" pero no tienen reservas activas
UPDATE [dbo].[Ejemplares]
SET Estado = 'Disponible'
WHERE Estado = 'Reservado'
AND EjemplarID NOT IN (
    -- Ejemplares que tienen reservas activas (Estado IN ('Activa', 'PorAprobar', 'Atendida'))
    SELECT DISTINCT EjemplarID
    FROM [dbo].[Reservas]
    WHERE Estado IN ('Activa', 'PorAprobar', 'Atendida')
    AND EjemplarID IS NOT NULL
);
GO

-- Mostrar estado actual de los ejemplares después de la corrección
SELECT 
    Estado,
    COUNT(*) AS Cantidad
FROM [dbo].[Ejemplares]
WHERE Estado != 'Baja'
GROUP BY Estado
ORDER BY Estado;
GO

-- Mostrar resumen de ejemplares disponibles por libro
SELECT 
    l.Titulo,
    COUNT(e.EjemplarID) AS TotalEjemplares,
    SUM(CASE WHEN e.Estado = 'Disponible' THEN 1 ELSE 0 END) AS Disponibles,
    SUM(CASE WHEN e.Estado = 'Prestado' THEN 1 ELSE 0 END) AS Prestados,
    SUM(CASE WHEN e.Estado = 'Reservado' THEN 1 ELSE 0 END) AS Reservados
FROM [dbo].[Libros] l
LEFT JOIN [dbo].[Ejemplares] e ON l.LibroID = e.LibroID AND (e.Estado != 'Baja' OR e.Estado IS NULL)
GROUP BY l.LibroID, l.Titulo
HAVING COUNT(e.EjemplarID) > 0
ORDER BY l.Titulo;
GO

