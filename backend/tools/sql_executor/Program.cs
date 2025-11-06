using System;
using System.IO;
using Microsoft.Data.SqlClient;
using System.Text.Json;

if (args.Length == 0)
{
    Console.Error.WriteLine("Uso: sql_executor <script.sql>");
    return 1;
}

var scriptPath = args[0];
if (!File.Exists(scriptPath))
{
    Console.Error.WriteLine($"No existe el archivo {scriptPath}");
    return 1;
}

// Buscar appsettings.json en el repo (subiendo hasta 8 niveles)
string? appsettingsPath = null;
var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
for (int i = 0; i < 12 && dir != null; i++)
{
    var candidate = Path.Combine(dir.FullName, "NeoLibro.WebAPI", "appsettings.json");
    if (File.Exists(candidate)) { appsettingsPath = candidate; break; }
    candidate = Path.Combine(dir.FullName, "NeoLibro.WebAPI", "appsettings.Development.json");
    if (File.Exists(candidate)) { appsettingsPath = candidate; break; }
    dir = dir.Parent;
}

if (appsettingsPath == null)
{
    Console.Error.WriteLine("No se encontró appsettings.json en el árbol de directorios (buscando NeoLibro.WebAPI/appsettings*.json)");
    return 1;
}

var json = File.ReadAllText(appsettingsPath);
using var doc = JsonDocument.Parse(json);
string? conn = null;
if (doc.RootElement.TryGetProperty("ConnectionStrings", out var cs))
{
    foreach (var prop in cs.EnumerateObject())
    {
        conn = prop.Value.GetString();
        if (!string.IsNullOrEmpty(conn)) break;
    }
}

if (string.IsNullOrEmpty(conn))
{
    Console.Error.WriteLine("No se encontró una cadena de conexión en appsettings.json");
    return 1;
}

var script = File.ReadAllText(scriptPath);

using var connection = new SqlConnection(conn);
connection.Open();

using var command = connection.CreateCommand();
command.CommandText = script;
command.CommandType = System.Data.CommandType.Text;
command.CommandTimeout = 60;

try
{
    command.ExecuteNonQuery();
    Console.WriteLine("Script ejecutado correctamente.");
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Error ejecutando script: {ex.Message}");
    return 1;
}