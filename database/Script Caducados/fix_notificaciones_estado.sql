/*
  fix_notificaciones_estado.sql

  Script de corrección permanente para la tabla Notificaciones.

  - Actualiza filas existentes donde Estado IS NULL a 'Pendiente'
  - Agrega una constraint DEFAULT ('Pendiente') para la columna Estado si no existe
  - Se ejecuta dentro de una transacción

  Uso: ejecutar en la base de datos BibliotecaFISI (o la que corresponda)
*/

BEGIN TRANSACTION;
BEGIN TRY

    -- Verificar si la columna Estado existe
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.name = 'Notificaciones' AND c.name = 'Estado'
    )
    BEGIN
        PRINT 'La columna Notificaciones.Estado no existe en esta base de datos. Abortando.';
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- 1) Actualizar filas existentes con NULL
    PRINT 'Actualizando filas con Estado NULL a ''Pendiente''...';
    UPDATE Notificaciones SET Estado = 'Pendiente' WHERE Estado IS NULL;

    -- 2) Agregar default constraint si no existe
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE OBJECT_NAME(dc.parent_object_id) = 'Notificaciones' AND c.name = 'Estado'
    )
    BEGIN
        PRINT 'Creando constraint DEFAULT DF_Notificaciones_Estado...';
        ALTER TABLE Notificaciones ADD CONSTRAINT DF_Notificaciones_Estado DEFAULT ('Pendiente') FOR Estado;
    END
    ELSE
    BEGIN
        PRINT 'Constraint DEFAULT para Notificaciones.Estado ya existe.';
    END

    COMMIT TRANSACTION;
    PRINT 'Corrección aplicada correctamente.';

END TRY
BEGIN CATCH
    PRINT 'Error al aplicar la corrección:';
    PRINT ERROR_MESSAGE();
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
