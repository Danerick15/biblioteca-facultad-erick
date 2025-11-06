README - Corrección Notificaciones
================================

Qué hace este script
- `fix_notificaciones_estado.sql` actualiza las filas existentes en la tabla `Notificaciones` donde `Estado` es NULL y añade una constraint DEFAULT ('Pendiente') para la columna `Estado` si no existe.

Cuándo ejecutarlo
- Ejecuta este script en tu base de datos de desarrollo o pruebas si obtienes errores por INSERTs en `Notificaciones` que intentan insertar NULL en `Estado` (error SQL 515).

Cómo ejecutarlo (PowerShell)
- Con sqlcmd (instalado con SQL Server tools):

```powershell
sqlcmd -S <SERVER_NAME> -d BibliotecaFISI -U <USER> -P <PASSWORD> -i ".\database\fix_notificaciones_estado.sql"
```

- Con Invoke-Sqlcmd (requiere módulo SqlServer):

```powershell
Invoke-Sqlcmd -ServerInstance "<SERVER_NAME>" -Database "BibliotecaFISI" -Username "<USER>" -Password "<PASSWORD>" -InputFile ".\database\fix_notificaciones_estado.sql"
```

Notas
- El script comprueba si existe la columna `Estado` antes de aplicar cambios y aborta con mensaje claro si la columna no está presente.
- Es buena práctica ejecutar este script en un entorno de pruebas antes de aplicarlo en producción.

Si quieres, puedo crear un pequeño task/README con los comandos exactos para tu entorno local.
