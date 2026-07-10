using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.Models;
using CoreK.API.DTOs;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductController : CoreKControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProductController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllProducts([FromQuery] int? categoryId, [FromQuery] string? search)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .AsQueryable();

            if (!IsAdmin)
            {
                query = query.Where(p => p.IsActive);
            }

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p => p.Title.Contains(term) || p.Description.Contains(term));
            }

            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.ProductId,
                    p.SellerId,
                    p.CategoryId,
                    p.Title,
                    p.Description,
                    p.Price,
                    p.IsActive,
                    p.CreatedAt,
                    Category = p.Category == null ? "Digital Product" : p.Category.CategoryName,
                    CategoryName = p.Category == null ? "Digital Product" : p.Category.CategoryName,
                    VersionCount = p.Versions.Count,
                    LatestVersion = p.Versions
                        .OrderByDescending(v => v.ReleaseDate)
                        .Select(v => v.VersionNumber)
                        .FirstOrDefault() ?? "1.0.0",
                    Versions = p.Versions
                        .OrderByDescending(v => v.ReleaseDate)
                        .Select(v => new
                        {
                            v.VersionId,
                            v.VersionNumber,
                            v.Changelog,
                            v.ReleaseDate
                        })
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetProduct(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null) return NotFound("Product listing not found.");

            return Ok(new
            {
                product.ProductId,
                product.SellerId,
                product.CategoryId,
                product.Title,
                product.Description,
                product.Price,
                product.IsActive,
                product.CreatedAt,
                Category = product.Category?.CategoryName ?? "Digital Product",
                CategoryName = product.Category?.CategoryName ?? "Digital Product",
                Versions = product.Versions
                    .OrderByDescending(v => v.ReleaseDate)
                    .Select(v => new
                    {
                        v.VersionId,
                        v.VersionNumber,
                        v.Changelog,
                        v.ReleaseDate
                    })
            });
        }

        [HttpGet("seller/{sellerId}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> GetSellerProducts(int sellerId)
        {
            if (!IsSelfOrAdmin(sellerId))
            {
                return Forbid();
            }

            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .Where(p => p.SellerId == sellerId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.ProductId,
                    p.CategoryId,
                    p.Title,
                    p.Description,
                    p.Price,
                    p.IsActive,
                    p.CreatedAt,
                    Category = p.Category == null ? "Digital Product" : p.Category.CategoryName,
                    VersionCount = p.Versions.Count,
                    LatestVersion = p.Versions
                        .OrderByDescending(v => v.ReleaseDate)
                        .Select(v => v.VersionNumber)
                        .FirstOrDefault() ?? "1.0.0"
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpPost("upload")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UploadProduct([FromForm] CreateProductDto productDto, IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("A digital file asset must be provided.");

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == productDto.CategoryId);
            if (!categoryExists) return BadRequest("Invalid category specified.");

            var product = new Product
            {
                SellerId = IsAdmin && productDto.SellerId > 0 ? productDto.SellerId : CurrentUserId,
                CategoryId = productDto.CategoryId,
                Title = productDto.Title,
                Description = productDto.Description,
                Price = productDto.Price,
                IsActive = IsAdmin
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync(); // Saves product first to generate its unique ProductId

            string filePath = await SaveUploadedAsset(file);

            var initialVersion = new ProductVersion
            {
                ProductId = product.ProductId,
                VersionNumber = "1.0.0",
                Changelog = "Initial Release Asset.",
                SecureFilePath = filePath
            };

            _context.ProductVersions.Add(initialVersion);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = product.IsActive
                    ? "Product and initial version uploaded successfully!"
                    : "Product submitted and waiting for admin validation.",
                productId = product.ProductId,
                status = product.IsActive ? "Approved" : "Pending Review"
            });
        }

        [HttpPut("{productId}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UpdateProduct(int productId, [FromBody] UpdateProductDto productDto)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound("Product listing not found.");
            if (!IsAdmin && product.SellerId != CurrentUserId) return Forbid();

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == productDto.CategoryId);
            if (!categoryExists) return BadRequest("Invalid category specified.");

            product.CategoryId = productDto.CategoryId;
            product.Title = productDto.Title;
            product.Description = productDto.Description;
            product.Price = productDto.Price;
            product.IsActive = IsAdmin ? productDto.IsActive : false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = IsAdmin
                    ? "Product listing updated successfully."
                    : "Product listing updated and waiting for admin validation.",
                status = product.IsActive ? "Approved" : "Pending Review"
            });
        }

        [HttpDelete("{productId}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> DeactivateProduct(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound("Product listing not found.");
            if (!IsAdmin && product.SellerId != CurrentUserId) return Forbid();

            product.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product listing has been deactivated." });
        }

        [HttpPost("{productId}/add-version")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> AddNewVersion(int productId, [FromForm] AddVersionDto versionDto, IFormFile? file)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound("Product listing not found.");
            if (!IsAdmin && product.SellerId != CurrentUserId) return Forbid();

            if (file == null || file.Length == 0) return BadRequest("Updated file asset must be provided.");

            string filePath = await SaveUploadedAsset(file);

            var newVersion = new ProductVersion
            {
                ProductId = productId,
                VersionNumber = versionDto.VersionNumber,
                Changelog = versionDto.Changelog,
                SecureFilePath = filePath
            };

            _context.ProductVersions.Add(newVersion);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Version {versionDto.VersionNumber} pushed successfully!" });
        }

        private async Task<string> SaveUploadedAsset(IFormFile file)
        {
            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            string uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return filePath;
        }
    }
}
