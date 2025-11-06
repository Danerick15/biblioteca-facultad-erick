-- =============================================
-- Script para eliminar el usuario administrador
-- =============================================

USE BibliotecaFISI;
GO

-- Eliminar usuario administrador por email específico
DELETE FROM Usuarios
WHERE EmailInstitucional = 'admin@unmsm.edu.pe';

-- También eliminar por código específico
DELETE FROM Usuarios
WHERE CodigoUniversitario = '12345678';

-- Eliminar todos los administradores (descomenta si quieres eliminar todos)
-- DELETE FROM Usuarios WHERE Rol = 'Administrador';

PRINT 'Usuario administrador eliminado (si existía).';
PRINT 'Verifica que se haya eliminado correctamente ejecutando:';
PRINT 'SELECT * FROM Usuarios WHERE Rol = ''Administrador'';';
GO

