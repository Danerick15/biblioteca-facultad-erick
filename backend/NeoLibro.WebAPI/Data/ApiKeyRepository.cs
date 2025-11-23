using System.Data;
using Microsoft.Data.SqlClient;
using NeoLibroAPI.Models.Entities;
using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Data
{
    /// <summary>
    /// Implementación del repositorio de API Keys
    /// </summary>
    public class ApiKeyRepository : IApiKeyRepository
    {
        private readonly string _cadenaConexion;

        public ApiKeyRepository(string cadenaConexion)
        {
            _cadenaConexion = cadenaConexion;
        }

        private SqlConnection GetConnection()
        {
            return new SqlConnection(_cadenaConexion);
        }

        public ApiKey? ObtenerPorApiKey(string apiKey)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT ApiKeyID, ApiKey, Nombre, Descripcion, Activa, 
                           FechaCreacion, FechaUltimoUso, ContadorUso, 
                           LimiteUsoDiario, CreadoPor
                    FROM ApiKeys
                    WHERE ApiKey = @ApiKey", cn);
                cmd.Parameters.AddWithValue("@ApiKey", apiKey);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        return new ApiKey
                        {
                            ApiKeyID = Convert.ToInt32(dr["ApiKeyID"]),
                            Key = dr["ApiKey"].ToString() ?? "",
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Descripcion = dr["Descripcion"]?.ToString(),
                            Activa = Convert.ToBoolean(dr["Activa"]),
                            FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                            FechaUltimoUso = dr["FechaUltimoUso"] != DBNull.Value ? Convert.ToDateTime(dr["FechaUltimoUso"]) : null,
                            ContadorUso = dr["ContadorUso"] != DBNull.Value ? Convert.ToInt32(dr["ContadorUso"]) : 0,
                            LimiteUsoDiario = dr["LimiteUsoDiario"] != DBNull.Value ? Convert.ToInt32(dr["LimiteUsoDiario"]) : null,
                            CreadoPor = dr["CreadoPor"] != DBNull.Value ? Convert.ToInt32(dr["CreadoPor"]) : null
                        };
                    }
                }
            }

            return null;
        }

        public List<ApiKey> Listar()
        {
            var lista = new List<ApiKey>();

            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT ApiKeyID, ApiKey, Nombre, Descripcion, Activa, 
                           FechaCreacion, FechaUltimoUso, ContadorUso, 
                           LimiteUsoDiario, CreadoPor
                    FROM ApiKeys
                    ORDER BY FechaCreacion DESC", cn);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    while (dr.Read())
                    {
                        lista.Add(new ApiKey
                        {
                            ApiKeyID = Convert.ToInt32(dr["ApiKeyID"]),
                            Key = dr["ApiKey"].ToString() ?? "",
                            Nombre = dr["Nombre"].ToString() ?? "",
                            Descripcion = dr["Descripcion"]?.ToString(),
                            Activa = Convert.ToBoolean(dr["Activa"]),
                            FechaCreacion = Convert.ToDateTime(dr["FechaCreacion"]),
                            FechaUltimoUso = dr["FechaUltimoUso"] != DBNull.Value ? Convert.ToDateTime(dr["FechaUltimoUso"]) : null,
                            ContadorUso = dr["ContadorUso"] != DBNull.Value ? Convert.ToInt32(dr["ContadorUso"]) : 0,
                            LimiteUsoDiario = dr["LimiteUsoDiario"] != DBNull.Value ? Convert.ToInt32(dr["LimiteUsoDiario"]) : null,
                            CreadoPor = dr["CreadoPor"] != DBNull.Value ? Convert.ToInt32(dr["CreadoPor"]) : null
                        });
                    }
                }
            }

            return lista;
        }

        public bool Crear(ApiKey apiKey)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    INSERT INTO ApiKeys (ApiKey, Nombre, Descripcion, Activa, FechaCreacion, LimiteUsoDiario, CreadoPor)
                    VALUES (@ApiKey, @Nombre, @Descripcion, @Activa, @FechaCreacion, @LimiteUsoDiario, @CreadoPor)", cn);
                cmd.Parameters.AddWithValue("@ApiKey", apiKey.Key);
                cmd.Parameters.AddWithValue("@Nombre", apiKey.Nombre);
                cmd.Parameters.AddWithValue("@Descripcion", apiKey.Descripcion ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Activa", apiKey.Activa);
                cmd.Parameters.AddWithValue("@FechaCreacion", apiKey.FechaCreacion);
                cmd.Parameters.AddWithValue("@LimiteUsoDiario", apiKey.LimiteUsoDiario ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CreadoPor", apiKey.CreadoPor ?? (object)DBNull.Value);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool ActualizarUso(int apiKeyID, string? ipAddress, string? userAgent)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE ApiKeys 
                    SET FechaUltimoUso = GETDATE(),
                        ContadorUso = ContadorUso + 1
                    WHERE ApiKeyID = @ApiKeyID", cn);
                cmd.Parameters.AddWithValue("@ApiKeyID", apiKeyID);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool Desactivar(int apiKeyID)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    UPDATE ApiKeys 
                    SET Activa = 0
                    WHERE ApiKeyID = @ApiKeyID", cn);
                cmd.Parameters.AddWithValue("@ApiKeyID", apiKeyID);

                cn.Open();
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool PuedeUsar(int apiKeyID)
        {
            using (var cn = GetConnection())
            {
                var cmd = new SqlCommand(@"
                    SELECT Activa, LimiteUsoDiario, ContadorUso,
                           (SELECT COUNT(*) FROM ApiKeyLogs 
                            WHERE ApiKeyID = @ApiKeyID 
                            AND CAST(FechaAcceso AS DATE) = CAST(GETDATE() AS DATE)) as UsosHoy
                    FROM ApiKeys
                    WHERE ApiKeyID = @ApiKeyID", cn);
                cmd.Parameters.AddWithValue("@ApiKeyID", apiKeyID);
                cn.Open();

                using (var dr = cmd.ExecuteReader())
                {
                    if (dr.Read())
                    {
                        bool activa = Convert.ToBoolean(dr["Activa"]);
                        if (!activa) return false;

                        int? limiteDiario = dr["LimiteUsoDiario"] != DBNull.Value ? Convert.ToInt32(dr["LimiteUsoDiario"]) : null;
                        if (limiteDiario.HasValue)
                        {
                            int usosHoy = dr["UsosHoy"] != DBNull.Value ? Convert.ToInt32(dr["UsosHoy"]) : 0;
                            return usosHoy < limiteDiario.Value;
                        }

                        return true;
                    }
                }
            }

            return false;
        }
    }
}


