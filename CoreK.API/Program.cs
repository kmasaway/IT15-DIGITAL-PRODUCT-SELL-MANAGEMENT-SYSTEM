using CoreK.API.Data;
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