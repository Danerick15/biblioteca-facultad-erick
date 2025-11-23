using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using NeoLibroAPI.Interfaces;
using NeoLibroAPI.Data;
using NeoLibroAPI.Business;
using NeoLibroAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configurar cadena de conexión
var connectionString = builder.Configuration.GetConnectionString("cnnNeoLibroDB") ?? throw new InvalidOperationException("Connection string 'cnnNeoLibroDB' not found.");

// Código antiguo eliminado - ahora usamos la nueva arquitectura con interfaces

// Registrar servicios NUEVOS con interfaces (MÓDULO USUARIOS)
builder.Services.AddScoped<IUsuarioRepository>(provider => new UsuarioRepository(connectionString));
builder.Services.AddScoped<IUsuarioBusiness, UsuarioBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO LIBROS)
builder.Services.AddScoped<ILibroRepository>(provider => new LibroRepository(connectionString));
builder.Services.AddScoped<ILibroBusiness>(provider => new LibroBusiness(
    provider.GetRequiredService<ILibroRepository>(),
    provider.GetRequiredService<IAutorBusiness>(),
    provider.GetRequiredService<ICategoriaBusiness>(),
    provider.GetRequiredService<IEjemplarBusiness>()
));

// Registrar servicios NUEVOS con interfaces (MÓDULO EJEMPLARES)
builder.Services.AddScoped<IEjemplarRepository>(provider => new EjemplarRepository(connectionString));
builder.Services.AddScoped<IEjemplarBusiness, EjemplarBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO PRÉSTAMOS)
builder.Services.AddScoped<IPrestamoRepository>(provider => 
    new PrestamoRepository(connectionString, provider.GetRequiredService<IEjemplarRepository>()));
builder.Services.AddScoped<IPrestamoBusiness, PrestamoBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO MULTAS)
builder.Services.AddScoped<IMultaRepository>(provider => new MultaRepository(connectionString));
builder.Services.AddScoped<IMultaBusiness, MultaBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO RESERVAS)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));
// ReservaRepository necesita el ApplicationDbContext y la cadena de conexión para ejecutar el SP;
// lo registramos con una fábrica que provee ambos.
builder.Services.AddScoped<IReservaRepository>(provider => 
    new ReservaRepository(provider.GetRequiredService<ApplicationDbContext>(), connectionString));
builder.Services.AddScoped<IReservaBusiness, ReservaBusiness>();
builder.Services.AddScoped<INotificacionRepository, NotificacionRepository>();

// Registrar servicios NUEVOS con interfaces (MÓDULO AUTORES)
builder.Services.AddScoped<IAutorRepository>(provider => new AutorRepository(connectionString));
builder.Services.AddScoped<IAutorBusiness, AutorBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO CATEGORÍAS)
builder.Services.AddScoped<ICategoriaRepository>(provider => new CategoriaRepository(connectionString));
builder.Services.AddScoped<ICategoriaBusiness, CategoriaBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO RECOMENDACIONES)
builder.Services.AddScoped<IRecomendacionRepository>(provider => new RecomendacionRepository(connectionString));
builder.Services.AddScoped<IRecomendacionBusiness, RecomendacionBusiness>();

// Registrar servicios NUEVOS con interfaces (MÓDULO API KEYS)
builder.Services.AddScoped<IApiKeyRepository>(provider => new ApiKeyRepository(connectionString));

builder.Services.AddAuthentication("MiCookieAuth")
    .AddCookie("MiCookieAuth", options =>
    {
        options.Cookie.Name = "NeoLibro.Auth";
        options.Cookie.HttpOnly = true;
        // Configuración condicional: HTTPS en producción, HTTP en desarrollo
        options.Cookie.SecurePolicy = builder.Environment.IsProduction() 
            ? CookieSecurePolicy.Always 
            : CookieSecurePolicy.None;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.Path = "/"; // Path específico para la cookie
        // No establecer Domain para que sea específica del host (localhost)
        // Esto evita que se comparta entre diferentes perfiles de navegador
        options.LoginPath = "/api/Usuarios/login";
        options.AccessDeniedPath = "/api/Usuarios/acceso-denegado";
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;

        // Clave: NO redirecciones para /api
        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = ctx =>
            {
                if (ctx.Request.Path.StartsWithSegments("/api"))
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }
                ctx.Response.Redirect(ctx.RedirectUri);
                return Task.CompletedTask;
            },
            OnRedirectToAccessDenied = ctx =>
            {
                if (ctx.Request.Path.StartsWithSegments("/api"))
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
                ctx.Response.Redirect(ctx.RedirectUri);
                return Task.CompletedTask;
            }
        };
    });


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();


app.UseCors("FrontendDev");

// Registrar middleware de Rate Limiting (debe ir antes de UseAuthentication)
var rateLimitingConfig = builder.Configuration.GetSection("RateLimiting");
app.UseRateLimiting(options =>
{
    options.MaxRequests = rateLimitingConfig.GetValue<int>("MaxRequests", 5);
    options.Window = TimeSpan.FromMinutes(rateLimitingConfig.GetValue<int>("WindowMinutes", 15));
    options.ProtectedPaths = rateLimitingConfig.GetSection("ProtectedPaths").Get<List<string>>() 
        ?? new List<string> { "/api/Auth", "/api/Usuarios/login" };
});

// Registrar middleware de API Key (debe ir antes de UseAuthentication)
app.UseApiKeyMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();


app.Run();