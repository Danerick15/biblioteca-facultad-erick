using System;
using System.IO;
using Microsoft.Data.SqlClient;
using System.Text.Json;

// Simple utility to insert a row into __EFMigrationsHistory if missing.
// Reads connection string from appsettings.json in the parent project.

string basePath = AppContext.BaseDirectory;
// Buscar appsettings.json subiendo hacia arriba hasta la raíz del repo (máx 12 niveles)
string? appsettingsPath = null;
var dir = new DirectoryInfo(basePath);
for (int i = 0; i < 12 && dir != null; i++)
{
    var candidateDev = Path.Combine(dir.FullName, "appsettings.Development.json");
    var candidate = Path.Combine(dir.FullName, "appsettings.json");
    if (File.Exists(candidateDev))
    {
        appsettingsPath = candidateDev;
        break;
    }
    if (File.Exists(candidate))
    {
        appsettingsPath = candidate;
        break;
    }
    dir = dir.Parent;
}
if (appsettingsPath == null)
{
    Console.Error.WriteLine($"No se encontró appsettings.json en los directorios padres a partir de {basePath}");
    return 1;
}

Console.WriteLine($"Buscando cadena de conexión en {appsettingsPath}");
string json = File.ReadAllText(appsettingsPath);
using var doc = JsonDocument.Parse(json);
string? conn = null;
if (doc.RootElement.TryGetProperty("ConnectionStrings", out var cs))
{
    // Tomar la cadena de cnnNeoLibroDB o la primera disponible
    JsonElement cnnValue;
    if (cs.TryGetProperty("cnnNeoLibroDB", out cnnValue))
    {
        conn = cnnValue.GetString();
        Console.WriteLine("Usando cadena de conexión cnnNeoLibroDB");
    }
    else
    {
        // Si no hay cnnNeoLibroDB, tomar la primera que encontremos
        foreach (var prop in cs.EnumerateObject())
        {
            conn = prop.Value.GetString();
            Console.WriteLine($"Usando cadena de conexión {prop.Name}");
            if (!string.IsNullOrEmpty(conn)) break;
        }
    }
}
if (string.IsNullOrEmpty(conn))
{
    // Si aún no tenemos conexión, buscar en appsettings.json (no Development)
    var baseAppsettings = Path.Combine(Path.GetDirectoryName(appsettingsPath)!, "appsettings.json");
    if (File.Exists(baseAppsettings))
    {
        Console.WriteLine($"Buscando cadena de conexión en {baseAppsettings}");
        json = File.ReadAllText(baseAppsettings);
        using var baseDoc = JsonDocument.Parse(json);
        if (baseDoc.RootElement.TryGetProperty("ConnectionStrings", out var baseCs))
        {
            // Intentar primero cnnNeoLibroDB
            JsonElement baseCnnValue;
            if (baseCs.TryGetProperty("cnnNeoLibroDB", out baseCnnValue))
            {
                conn = baseCnnValue.GetString();
                Console.WriteLine("Usando cadena de conexión cnnNeoLibroDB de appsettings.json");
            }
            else
            {
                // Si no, tomar la primera disponible
                foreach (var prop in baseCs.EnumerateObject())
                {
                    conn = prop.Value.GetString();
                    Console.WriteLine($"Usando cadena de conexión {prop.Name} de appsettings.json");
                    if (!string.IsNullOrEmpty(conn)) break;
                }
            }
        }
    }
}
if (string.IsNullOrEmpty(conn))
{
    Console.Error.WriteLine("No se encontró ninguna cadena de conexión válida en ningún appsettings.json (ConnectionStrings).");
    return 1;
}

string migrationId = "20251030120553_AgregarCamposReserva";
string productVersion = "8.0.12";

using var connection = new SqlConnection(conn);
connection.Open();

string ensureTableSql = @"
IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory](
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END";
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = ensureTableSql;
    cmd.ExecuteNonQuery();
}

string checkSql = "SELECT COUNT(1) FROM [__EFMigrationsHistory] WHERE MigrationId = @migrationId";
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = checkSql;
    cmd.Parameters.AddWithValue("@migrationId", migrationId);
    var exists = (int)cmd.ExecuteScalar()!;
    if (exists > 0)
    {
        Console.WriteLine($"La migración {migrationId} ya está registrada en __EFMigrationsHistory.");
        return 0;
    }
}

string insertSql = "INSERT INTO [__EFMigrationsHistory] (MigrationId, ProductVersion) VALUES (@migrationId, @productVersion)";
using (var cmd = connection.CreateCommand())
{
    cmd.CommandText = insertSql;
    cmd.Parameters.AddWithValue("@migrationId", migrationId);
    cmd.Parameters.AddWithValue("@productVersion", productVersion);
    cmd.ExecuteNonQuery();
}

Console.WriteLine($"Insertada migración {migrationId} en __EFMigrationsHistory (ProductVersion={productVersion}).");
return 0;