using CoreK.API.Data;
using CoreK.API.Controllers;
using CoreK.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    }));

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
    EnsureSellerAccountTables(db, app.Logger);
    SeedMarketplaceCategories(db);
    SeedAdminAccount(db, app.Configuration);
    RemoveKnownTestAccounts(db, app.Logger);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); 
}

// 3. Activate the CORS policy right before routing/authorization
app.UseCors(reactCorsPolicy);

app.UseHttpsRedirection();
app.UseDefaultFiles();
var spaShellFileOptions = new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.File.Name.Equals("index.html", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            context.Context.Response.Headers.Pragma = "no-cache";
            context.Context.Response.Headers.Expires = "0";
        }
    }
};

app.UseStaticFiles(spaShellFileOptions);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html", spaShellFileOptions);

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

static void RemoveKnownTestAccounts(AppDbContext db, ILogger logger)
{
    var testEmails = new[]
    {
        "codex-check-20260708092139@example.test"
    };

    foreach (var email in testEmails)
    {
        try
        {
            var user = db.Users.FirstOrDefault(user => user.Email == email);
            if (user == null)
            {
                continue;
            }

            var userId = user.UserId;
            var productIds = db.Products
                .Where(product => product.SellerId == userId)
                .Select(product => product.ProductId)
                .ToList();
            var orderIds = db.Orders
                .Where(order => order.CustomerId == userId || productIds.Contains(order.ProductId))
                .Select(order => order.OrderId)
                .ToList();

            db.ChatMessages.RemoveRange(db.ChatMessages.Where(message =>
                message.SellerId == userId ||
                message.CustomerId == userId ||
                message.SenderId == userId ||
                (message.ProductId.HasValue && productIds.Contains(message.ProductId.Value))));
            db.SupportTickets.RemoveRange(db.SupportTickets.Where(ticket =>
                ticket.CustomerId == userId ||
                (ticket.ProductId.HasValue && productIds.Contains(ticket.ProductId.Value)) ||
                (ticket.OrderId.HasValue && orderIds.Contains(ticket.OrderId.Value))));
            db.PayoutRequests.RemoveRange(db.PayoutRequests.Where(request => request.SellerId == userId));
            db.SellerSubscriptions.RemoveRange(db.SellerSubscriptions.Where(subscription => subscription.SellerId == userId));
            db.ValidIdSubmissions.RemoveRange(db.ValidIdSubmissions.Where(submission => submission.UserId == userId));
            db.Orders.RemoveRange(db.Orders.Where(order => orderIds.Contains(order.OrderId)));
            db.ProductVersions.RemoveRange(db.ProductVersions.Where(version => productIds.Contains(version.ProductId)));
            db.Products.RemoveRange(db.Products.Where(product => productIds.Contains(product.ProductId)));
            db.Users.Remove(user);
            db.SaveChanges();

            logger.LogInformation("Removed known test account {Email}.", email);
        }
        catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
        {
            logger.LogWarning(ex, "Known test account cleanup skipped because operational tables are still being prepared.");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Known test account cleanup failed for {Email}.", email);
        }
    }
}

static void EnsureSellerAccountTables(AppDbContext db, ILogger logger)
{
    try
    {
        db.Database.ExecuteSqlRaw("""
            IF OBJECT_ID(N'[SellerSubscriptions]', N'U') IS NULL
            BEGIN
                CREATE TABLE [SellerSubscriptions] (
                    [SellerSubscriptionId] int NOT NULL IDENTITY,
                    [SellerId] int NOT NULL,
                    [Plan] nvarchar(50) NOT NULL,
                    [BillingCycle] nvarchar(50) NOT NULL,
                    [BillingEmail] nvarchar(150) NOT NULL,
                    [Seats] int NOT NULL,
                    [AutoRenew] bit NOT NULL,
                    [UpdatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_SellerSubscriptions] PRIMARY KEY ([SellerSubscriptionId]),
                    CONSTRAINT [FK_SellerSubscriptions_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
                );
            END;

            IF OBJECT_ID(N'[ValidIdSubmissions]', N'U') IS NULL
            BEGIN
                CREATE TABLE [ValidIdSubmissions] (
                    [ValidIdSubmissionId] int NOT NULL IDENTITY,
                    [UserId] int NOT NULL,
                    [IdType] nvarchar(50) NOT NULL,
                    [IdNumber] nvarchar(80) NOT NULL,
                    [FileName] nvarchar(260) NOT NULL,
                    [FilePath] nvarchar(500) NOT NULL,
                    [Status] nvarchar(50) NOT NULL,
                    [Remarks] nvarchar(500) NULL,
                    [SubmittedAt] datetime2 NOT NULL,
                    [ReviewedAt] datetime2 NULL,
                    CONSTRAINT [PK_ValidIdSubmissions] PRIMARY KEY ([ValidIdSubmissionId]),
                    CONSTRAINT [FK_ValidIdSubmissions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]) ON DELETE CASCADE
                );
            END;

            IF OBJECT_ID(N'[PayoutRequests]', N'U') IS NULL
            BEGIN
                CREATE TABLE [PayoutRequests] (
                    [PayoutRequestId] int NOT NULL IDENTITY,
                    [SellerId] int NOT NULL,
                    [Amount] decimal(10,2) NOT NULL,
                    [PayoutMethod] nvarchar(50) NOT NULL,
                    [PayoutAccountName] nvarchar(150) NOT NULL,
                    [PayoutAccountNumber] nvarchar(80) NOT NULL,
                    [RangeStart] datetime2 NULL,
                    [RangeEnd] datetime2 NULL,
                    [Status] nvarchar(50) NOT NULL,
                    [RequestedAt] datetime2 NOT NULL,
                    [ReviewedAt] datetime2 NULL,
                    CONSTRAINT [PK_PayoutRequests] PRIMARY KEY ([PayoutRequestId]),
                    CONSTRAINT [FK_PayoutRequests_Users_SellerId] FOREIGN KEY ([SellerId]) REFERENCES [Users] ([UserId]) ON DELETE NO ACTION
                );
            END;

            IF OBJECT_ID(N'[ChatMessages]', N'U') IS NULL
            BEGIN
                CREATE TABLE [ChatMessages] (
                    [ChatMessageId] int NOT NULL IDENTITY,
                    [SellerId] int NOT NULL,
                    [CustomerId] int NOT NULL,
                    [ProductId] int NULL,
                    [SenderId] int NOT NULL,
                    [SenderName] nvarchar(150) NOT NULL,
                    [SenderRole] nvarchar(50) NOT NULL,
                    [Message] nvarchar(max) NOT NULL,
                    [CreatedAt] datetime2 NOT NULL,
                    CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([ChatMessageId]),
                    CONSTRAINT [FK_ChatMessages_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]) ON DELETE SET NULL
                );
            END;

            IF OBJECT_ID(N'[SellerSubscriptions]', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_SellerSubscriptions_SellerId'
                        AND [object_id] = OBJECT_ID(N'[SellerSubscriptions]')
                )
            BEGIN
                CREATE UNIQUE INDEX [IX_SellerSubscriptions_SellerId] ON [SellerSubscriptions] ([SellerId]);
            END;

            IF OBJECT_ID(N'[ValidIdSubmissions]', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_ValidIdSubmissions_UserId'
                        AND [object_id] = OBJECT_ID(N'[ValidIdSubmissions]')
                )
            BEGIN
                CREATE UNIQUE INDEX [IX_ValidIdSubmissions_UserId] ON [ValidIdSubmissions] ([UserId]);
            END;

            IF OBJECT_ID(N'[PayoutRequests]', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_PayoutRequests_SellerId'
                        AND [object_id] = OBJECT_ID(N'[PayoutRequests]')
                )
            BEGIN
                CREATE INDEX [IX_PayoutRequests_SellerId] ON [PayoutRequests] ([SellerId]);
            END;

            IF OBJECT_ID(N'[ChatMessages]', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_ChatMessages_ProductId'
                        AND [object_id] = OBJECT_ID(N'[ChatMessages]')
                )
            BEGIN
                CREATE INDEX [IX_ChatMessages_ProductId] ON [ChatMessages] ([ProductId]);
            END;

            IF OBJECT_ID(N'[ChatMessages]', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_ChatMessages_SellerId_CustomerId_CreatedAt'
                        AND [object_id] = OBJECT_ID(N'[ChatMessages]')
                )
            BEGIN
                CREATE INDEX [IX_ChatMessages_SellerId_CustomerId_CreatedAt] ON [ChatMessages] ([SellerId], [CustomerId], [CreatedAt]);
            END;
            """);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Operational tables could not be verified or created.");
    }
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
