using NeoLibroAPI.Interfaces;

namespace NeoLibroAPI.Middleware
{
    /// <summary>
    /// Middleware para validar API Keys en endpoints públicos
    /// </summary>
    public class ApiKeyMiddleware
    {
        private readonly RequestDelegate _next;
        private const string API_KEY_HEADER = "X-API-Key";

        public ApiKeyMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IApiKeyRepository apiKeyRepository)
        {
            // Solo validar en rutas de API pública
            if (context.Request.Path.StartsWithSegments("/api/public"))
            {
                if (!context.Request.Headers.TryGetValue(API_KEY_HEADER, out var extractedApiKey))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { mensaje = "API Key requerida. Incluye el header X-API-Key." });
                    return;
                }

                var apiKey = apiKeyRepository.ObtenerPorApiKey(extractedApiKey.ToString());

                if (apiKey == null || !apiKey.Activa)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { mensaje = "API Key inválida o inactiva." });
                    return;
                }

                // Verificar límite de uso diario
                if (!apiKeyRepository.PuedeUsar(apiKey.ApiKeyID))
                {
                    context.Response.StatusCode = 429;
                    await context.Response.WriteAsJsonAsync(new { mensaje = "Límite de uso diario excedido." });
                    return;
                }

                // Actualizar uso
                var ipAddress = context.Connection.RemoteIpAddress?.ToString();
                var userAgent = context.Request.Headers["User-Agent"].ToString();
                apiKeyRepository.ActualizarUso(apiKey.ApiKeyID, ipAddress, userAgent);

                // Agregar información de la API Key al contexto para uso posterior
                context.Items["ApiKey"] = apiKey;
            }

            await _next(context);
        }
    }

    /// <summary>
    /// Extension method para registrar el middleware
    /// </summary>
    public static class ApiKeyMiddlewareExtensions
    {
        public static IApplicationBuilder UseApiKeyMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ApiKeyMiddleware>();
        }
    }
}


