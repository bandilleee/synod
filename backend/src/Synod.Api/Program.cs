using Microsoft.EntityFrameworkCore;
using Serilog;
using Synod.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// === Serilog Logging ===
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// === Database ===
builder.Services.AddDbContext<SynodDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// === CORS ===
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetValue<string>("AllowedOrigins") ?? "http://localhost:3000";
        policy.WithOrigins(origins.Split(','))
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
            // .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// === Controllers ===
builder.Services.AddControllers();

// === Swagger ===
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() 
    { 
        Title = "Synod API", 
        Version = "v1",
        Description = "API for the Synod collaboration platform"
    });
});

var app = builder.Build();

// === Middleware Pipeline ===
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// === Start ===
Log.Information("Synod API starting on {Urls}", app.Urls);
app.Run();
