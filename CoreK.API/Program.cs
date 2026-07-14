using CoreK.API.Data;
using CoreK.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var tokenSecret = builder.Configuration["AppSettings:TokenSecret"];
var corsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured.");
}

if (string.IsNullOrWhiteSpace(tokenSecret))
{
    throw new InvalidOperationException("AppSettings:TokenSecret must be configured.");
}

// 1. Define a CORS policy name
var reactCorsPolicy = "_reactCorsPolicy";


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// 2. Configure CORS to accept requests from your future React dev port
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: reactCorsPolicy,
        policy =>
        {
            policy.WithOrigins(corsOrigins) // Vite & deployed frontend origins
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedMarketplaceCategories(db);
    SeedAdminAccount(db, app.Configuration);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); 
}

// 3. Activate the CORS policy right before routing/authorization
app.UseCors(reactCorsPolicy);

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static void SeedAdminAccount(AppDbContext db, IConfiguration configuration)
{
    var adminEmail = configuration["AdminSeed:Email"];
    var adminPassword = configuration["AdminSeed:Password"];

    if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
    {
        return;
    }

    var adminExists = db.Users.Any(user => user.Email == adminEmail);
    if (adminExists)
    {
        return;
    }

    var admin = new User
    {
        FullName = "CoreK Admin",
        Email = adminEmail,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
        Role = "Admin",
        IsEmailVerified = true,
        EmailVerificationToken = null,
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(admin);
    db.SaveChanges();
}

static void SeedMarketplaceCategories(AppDbContext db)
{
    var categorySeeds = new[]
    {
        new Category
        {
            CategoryName = "Software & Tech",
            Description = "Coding scripts, plugins, automation workflows, and software tools."
        },
        new Category
        {
            CategoryName = "Business & Finance",
            Description = "Pitch decks, swipe files, financial models, and specialized marketing guides."
        },
        new Category
        {
            CategoryName = "3D Assets",
            Description = "Models, environments, and character assets such as VRChat avatars and Blender assets."
        },
        new Category
        {
            CategoryName = "Design Assets",
            Description = "UI kits, icons, fonts, Procreate brushes, Lightroom presets, and textures."
        },
        new Category
        {
            CategoryName = "Education & Courses",
            Description = "Comprehensive video tutorials, webinars, and masterclasses."
        },
        new Category
        {
            CategoryName = "Self-Help & Productivity",
            Description = "Notion templates, printable planners, dashboards, and meditation audio."
        },
        new Category
        {
            CategoryName = "Art & Entertainment",
            Description = "Comic books, e-books, music sample packs, and digital stickers."
        }
    };

    var legacyCategoryNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["Software"] = "Software & Tech",
        ["Templates"] = "Business & Finance",
        ["Graphics"] = "Design Assets",
        ["Music"] = "Art & Entertainment",
        ["3D Models"] = "3D Assets"
    };

    var categories = db.Categories.ToList();

    foreach (var legacyCategoryName in legacyCategoryNames)
    {
        var category = categories.FirstOrDefault(c =>
            c.CategoryName.Equals(legacyCategoryName.Key, StringComparison.OrdinalIgnoreCase));

        if (category == null)
        {
            continue;
        }

        var seed = categorySeeds.First(c =>
            c.CategoryName.Equals(legacyCategoryName.Value, StringComparison.OrdinalIgnoreCase));

        var targetExists = categories.Any(c =>
            c.CategoryId != category.CategoryId &&
            c.CategoryName.Equals(seed.CategoryName, StringComparison.OrdinalIgnoreCase));

        if (targetExists)
        {
            continue;
        }

        category.CategoryName = seed.CategoryName;
        category.Description = seed.Description;
    }

    foreach (var seed in categorySeeds)
    {
        var existingCategory = categories.FirstOrDefault(c =>
            c.CategoryName.Equals(seed.CategoryName, StringComparison.OrdinalIgnoreCase));

        if (existingCategory == null)
        {
            var category = new Category
            {
                CategoryName = seed.CategoryName,
                Description = seed.Description
            };

            db.Categories.Add(category);
            categories.Add(category);
            continue;
        }

        existingCategory.Description = seed.Description;
    }

    db.SaveChanges();
}
