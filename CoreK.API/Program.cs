using CoreK.API.Data;
using CoreK.API.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
// 1. Define a CORS policy name
var reactCorsPolicy = "_reactCorsPolicy";


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 2. Configure CORS to accept requests from your future React dev port
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: reactCorsPolicy,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite & CRA ports
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Categories.Any())
    {
        db.Categories.AddRange(
            new Category { CategoryName = "Software", Description = "Applications, tools, scripts, and developer utilities." },
            new Category { CategoryName = "Templates", Description = "Business, design, website, and document templates." },
            new Category { CategoryName = "Graphics", Description = "Logos, UI kits, illustrations, and visual assets." },
            new Category { CategoryName = "Music", Description = "Audio packs, beats, loops, and sound effects." },
            new Category { CategoryName = "3D Models", Description = "Meshes, renders, models, and printable assets." }
        );
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); 
}

// 3. Activate the CORS policy right before routing/authorization
app.UseCors(reactCorsPolicy);

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
