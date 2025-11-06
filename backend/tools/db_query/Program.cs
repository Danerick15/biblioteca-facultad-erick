using System;
using System.IO;
using System.Text.Json;
using Microsoft.Data.SqlClient;

if (args.Length == 0)
{
    Console.Error.WriteLine("Uso: db_query <SQL_QUERY>");
    return 1;
}

var query = args[0];

// Buscar appsettings.json en NeoLibro.WebAPI
var baseDir = Directory.GetCurrentDirectory();
string? appsettings = null;
var dir = new DirectoryInfo(baseDir);
for (int i = 0; i < 12 && dir != null; i++)
{
    var candidate = Path.Combine(dir.FullName, "NeoLibro.WebAPI", "appsettings.json");
    if (File.Exists(candidate)) { appsettings = candidate; break; }
    candidate = Path.Combine(dir.FullName, "NeoLibro.WebAPI", "appsettings.Development.json");
    if (File.Exists(candidate)) { appsettings = candidate; break; }
    dir = dir.Parent;
}
if (appsettings == null)
{
    Console.Error.WriteLine("No se encontró appsettings.json en el árbol de directorios");
    return 1;
}

var json = File.ReadAllText(appsettings);
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
if (string.IsNullOrEmpty(conn)) { Console.Error.WriteLine("No hay cadena de conexión"); return 1; }

using var connection = new SqlConnection(conn);
connection.Open();
using var cmd = connection.CreateCommand();
cmd.CommandText = query;

try
{
    using var reader = cmd.ExecuteReader();
    var first = true;
    while (reader.Read())
    {
        for (int i = 0; i < reader.FieldCount; i++)
        {
            var name = reader.GetName(i);
            var val = reader.IsDBNull(i) ? "NULL" : reader.GetValue(i).ToString();
            Console.Write(name + ": " + val + "\t");
        }
        Console.WriteLine();
        first = false;
    }
    return 0;
}
catch (Exception ex)
{
    Console.Error.WriteLine("Error ejecutando query: " + ex.Message);
    return 1;
}