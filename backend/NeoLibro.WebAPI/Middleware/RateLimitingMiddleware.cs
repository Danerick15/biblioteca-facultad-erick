using System.Collections.Concurrent;
using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace NeoLibroAPI.Middleware
{
    /// <summary>
    /// Middleware de rate limiting para prevenir abusos en endpoints de autenticación
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly RateLimitingOptions _options;
        
        // Diccionario para almacenar intentos por IP
        private static readonly ConcurrentDictionary<string, RateLimitInfo> _requests = new();
        
        public RateLimitingMiddleware(RequestDelegate next, RateLimitingOptions options)
        {
            _next = next;
            _options = options;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Solo aplicar rate limiting a rutas de autenticación
            if (!_options.ProtectedPaths.Any(path => context.Request.Path.StartsWithSegments(path)))
            {
                await _next(context);
                return;
            }

            var ipAddress = GetClientIpAddress(context);
            
            // Limpiar entradas antiguas periódicamente
            CleanupOldEntries();

            var key = $"{ipAddress}:{context.Request.Path}";
            var now = DateTime.UtcNow;
            
            if (!_requests.TryGetValue(key, out var rateLimitInfo))
            {
                // Primera solicitud desde esta IP
                rateLimitInfo = new RateLimitInfo
                {
                    RequestCount = 1,
                    WindowStart = now
                };
                _requests.TryAdd(key, rateLimitInfo);
                await _next(context);
                return;
            }

            // Verificar si la ventana de tiempo ha expirado
            if (now - rateLimitInfo.WindowStart > _options.Window)
            {
                // Reiniciar contador
                rateLimitInfo.RequestCount = 1;
                rateLimitInfo.WindowStart = now;
                await _next(context);
                return;
            }

            // Incrementar contador
            rateLimitInfo.RequestCount++;

            // Verificar límite
            if (rateLimitInfo.RequestCount > _options.MaxRequests)
            {
                context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                context.Response.ContentType = "application/json";
                
                var retryAfter = (int)(_options.Window - (now - rateLimitInfo.WindowStart)).TotalSeconds;
                context.Response.Headers["Retry-After"] = retryAfter.ToString();
                
                await context.Response.WriteAsJsonAsync(new
                {
                    mensaje = $"Demasiadas solicitudes. Límite: {_options.MaxRequests} solicitudes por {_options.Window.TotalMinutes} minutos.",
                    retryAfter = retryAfter
                });
                return;
            }

            await _next(context);
        }

        private string GetClientIpAddress(HttpContext context)
        {
            // Intentar obtener IP real desde headers de proxy/load balancer
            var ipAddress = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(ipAddress))
            {
                // X-Forwarded-For puede contener múltiples IPs, tomar la primera
                ipAddress = ipAddress.Split(',')[0].Trim();
            }
            else
            {
                ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            }
            
            return ipAddress;
        }

        private void CleanupOldEntries()
        {
            // Limpiar entradas más antiguas que 2 ventanas de tiempo
            var cutoff = DateTime.UtcNow - (_options.Window * 2);
            var keysToRemove = _requests
                .Where(kvp => kvp.Value.WindowStart < cutoff)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _requests.TryRemove(key, out _);
            }
        }
    }

    /// <summary>
    /// Información de rate limiting por IP
    /// </summary>
    public class RateLimitInfo
    {
        public int RequestCount { get; set; }
        public DateTime WindowStart { get; set; }
    }

    /// <summary>
    /// Opciones de configuración para rate limiting
    /// </summary>
    public class RateLimitingOptions
    {
        public int MaxRequests { get; set; } = 5; // Por defecto: 5 solicitudes
        public TimeSpan Window { get; set; } = TimeSpan.FromMinutes(15); // Por defecto: 15 minutos
        public List<string> ProtectedPaths { get; set; } = new() { "/api/Auth", "/api/Usuarios/login" };
    }

    /// <summary>
    /// Extension method para registrar el middleware
    /// </summary>
    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder, Action<RateLimitingOptions>? configure = null)
        {
            var options = new RateLimitingOptions();
            configure?.Invoke(options);
            return builder.UseMiddleware<RateLimitingMiddleware>(options);
        }
    }
}

