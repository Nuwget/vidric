using System.Text;
using LojaGaleria.API.Auth;
using LojaGaleria.Domain.Entities;
using LojaGaleria.Domain.Enums;
using LojaGaleria.Domain.Tenancy;
using LojaGaleria.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, HttpTenantProvider>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            RoleClaimType = "role",
            NameClaimType = "sub",
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", policy => policy.RequireRole("SuperAdmin"));
    options.AddPolicy("LojaUser", policy => policy.RequireRole("AdminLoja", "Funcionario"));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "LojaGaleria API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole o token JWT (sem o prefixo 'Bearer')."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var existeSuperAdmin = await db.Usuarios.IgnoreQueryFilters()
        .AnyAsync(u => u.Papel == PapelUsuario.SuperAdmin);

    if (!existeSuperAdmin)
    {
        db.Usuarios.Add(new Usuario
        {
            Nome = "Super Admin",
            Email = "admin@lojagaleria.com",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Papel = PapelUsuario.SuperAdmin,
            LojaId = null
        });
        await db.SaveChangesAsync();
        app.Logger.LogWarning("SuperAdmin padrão criado: admin@lojagaleria.com / Admin@123 — TROQUE A SENHA!");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();