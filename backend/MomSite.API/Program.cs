using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using MomSite.Core.Interfaces;
using MomSite.Infrastructure.Data;
using MomSite.Infrastructure.Notifications;
using MomSite.Infrastructure.Services;
using Microsoft.Extensions.FileProviders;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers(options =>
{
    // Global request form limits for all controllers
    options.MaxModelBindingCollectionSize = int.MaxValue;
    options.MaxModelBindingRecursionDepth = 64;
}).AddJsonOptions(options =>
{
    // options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
});

// Configure form options for file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100MB
    options.ValueLengthLimit = int.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// Configure Kestrel for large file uploads
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100MB
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxConcurrentUpgradedConnections = 100;
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

// Only add Swagger in Development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Mom Site API", Version = "v1" });
        
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
            }
        });
    });
}

// Add CORS with development and production settings
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("DevelopmentCors", policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                  .WithHeaders("Authorization", "Content-Type", "Accept")
                  .AllowCredentials();
        });
    }
    else
    {
        options.AddPolicy("ProductionCors", policy =>
        {
            policy.WithOrigins(
                    "https://angelamoiseenko.ru",
                    "https://www.angelamoiseenko.ru"
                )
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .WithHeaders("Authorization", "Content-Type", "Accept")
                .AllowCredentials();
        });
    }
});

// Add Response Caching
builder.Services.AddResponseCaching();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add JWT Authentication with required secret
var jwtSecret = builder.Configuration["JWT:Secret"];
if (string.IsNullOrEmpty(jwtSecret))
{
    throw new InvalidOperationException("JWT:Secret is required and cannot be null or empty");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            // The default skew is five minutes, so a token stays usable that
            // much past its expiry. The admin session is short-lived anyway.
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// Add Authorization
builder.Services.AddAuthorization();

// Add custom services
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IFeedbackNotifier, EmailNotifier>();
builder.Services.AddScoped<IFeedbackNotifier, TelegramNotifier>();

// Behind nginx, the app only ever sees the proxy's own address unless we
// trust and apply X-Forwarded-For. Required so RemoteIpAddress (used both
// for lead persistence and for the anti-spam rate limiter below) reflects
// the real client IP rather than the reverse proxy's.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // The proxy topology (nginx on the same docker network) isn't known at
    // startup in every environment, so we trust any proxy rather than an
    // explicit allowlist. Nginx is the only thing that can reach this app.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Anti-spam rate limiting for the public contact form: at most N submissions
// per IP per window, stricter than nginx's general-purpose `limit_req`.
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton(new ContactRateLimiterOptions
{
    PermitLimit = builder.Configuration.GetValue<int?>("ContactRateLimit:PermitLimit") ?? 5,
    WindowMinutes = builder.Configuration.GetValue<int?>("ContactRateLimit:WindowMinutes") ?? 10
});
builder.Services.AddSingleton<IContactRateLimiter, FixedWindowContactRateLimiter>();

var app = builder.Build();

// Must run before anything that inspects the connection's remote IP.
app.UseForwardedHeaders();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Add Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
    await next();
});

// Configure request size limits for file uploads
app.Use(async (context, next) =>
{
    var maxRequestBodySizeFeature = context.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpMaxRequestBodySizeFeature>();
    if (maxRequestBodySizeFeature != null)
    {
        maxRequestBodySizeFeature.MaxRequestBodySize = 104857600; // 100MB
    }
    await next();
});

// Use CORS
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentCors");
}
else
{
    app.UseCors("ProductionCors");
}

// Use Response Caching
app.UseResponseCaching();

// Remove static files serving in production (use CDN instead)
if (app.Environment.IsDevelopment())
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(builder.Environment.ContentRootPath, "uploads")),
        RequestPath = "/uploads"
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (app.Environment.IsEnvironment("Testing"))
    {
        // Integration tests (WebApplicationFactory<Program>) run against a
        // lightweight relational provider, not Postgres. The checked-in
        // migrations contain Npgsql-specific column types, so replaying them
        // fails outside Postgres; create the schema straight from the model.
        dbContext.Database.EnsureCreated();
    }
    else
    {
        dbContext.Database.Migrate();
    }
}

app.Run();

// Exposed so WebApplicationFactory<Program> (integration tests) can bootstrap
// the app in-process for real HTTP pipeline testing.
public partial class Program { } 