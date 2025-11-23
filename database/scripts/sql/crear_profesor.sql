-- Script SQL para crear un profesor de prueba
-- Ejecutar este script en SQL Server Management Studio

-- Verificar si ya existe el profesor
IF EXISTS (SELECT 1 FROM Usuarios WHERE EmailInstitucional = 'profesor@unmsm.edu.pe')
BEGIN
    PRINT 'Ya existe un profesor con este email.'
    SELECT CodigoUniversitario, Nombre, EmailInstitucional, Rol 
    FROM Usuarios 
    WHERE EmailInstitucional = 'profesor@unmsm.edu.pe'
END
ELSE
BEGIN
    -- Crear el profesor
    INSERT INTO Usuarios (
        CodigoUniversitario, 
        Nombre, 
        EmailInstitucional, 
        ContrasenaHash, 
        Rol, 
        Estado, 
        FechaRegistro, 
        FechaUltimaActualizacionContrasena
    )
    VALUES (
        '87654321',  -- Código universitario
        'Profesor de Prueba',  -- Nombre
        'profesor@unmsm.edu.pe',  -- Email
        '84d0065337ca3df8dffe8de9e7165f9ab01c50978f1dcb9c598c6f34728da411',  -- Hash de "Profesor123!" (SHA-256)
        'Profesor',  -- Rol
        1,  -- Estado activo
        GETDATE(),  -- Fecha de registro
        GETDATE()  -- Fecha de actualización de contraseña
    )
    
    PRINT 'Profesor creado exitosamente!'
    PRINT 'Email: profesor@unmsm.edu.pe'
    PRINT 'Contraseña: Profesor123!'
END
GO

-- Nota: El hash de la contraseña debe calcularse correctamente
-- Para generar el hash correcto, usa el script Python o calcula SHA-256 de "Profesor123!"

