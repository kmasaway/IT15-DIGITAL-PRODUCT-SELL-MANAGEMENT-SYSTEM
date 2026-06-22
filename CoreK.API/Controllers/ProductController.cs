using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.Models;
using CoreK.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ProductController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // 1. GET ALL ACTIVE PRODUCTS (For Customers browsing the Marketplace)
        [HttpGet]
        public async Task<IActionResult> GetAllProducts([FromQuery] int? categoryId)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .Where(p => p.IsActive);

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            var products = await query.ToListAsync();
            return Ok(products);
        }

        // 2. CREATE PRODUCT LISTING WITH FIRST INITIAL FILE VERSION
        // Note: We use [FromForm] so the endpoint accepts file uploads alongside json fields
        [HttpPost("upload")]
        public async Task<IActionResult> UploadProduct([FromForm] CreateProductDto productDto, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("A digital file asset must be provided.");

            // Hardcoded Seller ID for testing until role guarding is turned on.
            // Later this will automatically grab the ID out of your JWT token: 
            // int sellerId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            int mockSellerId = 1; 

            // Verify Category Exists
            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == productDto.CategoryId);
            if (!categoryExists) return BadRequest("Invalid category specified.");

            // Create Product Metadata Reference
            var product = new Product
            {
                SellerId = mockSellerId,
                CategoryId = productDto.CategoryId,
                Title = productDto.Title,
                Description = productDto.Description,
                Price = productDto.Price
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync(); // Saves product first to generate its unique ProductId

            // Handle the physical file storage on disk
            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename to prevent overwriting
            string uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // Create initial version reference tracking back to the saved path
            var initialVersion = new ProductVersion
            {
                ProductId = product.ProductId,
                VersionNumber = "1.0.0",
                Changelog = "Initial Release Asset.",
                SecureFilePath = filePath
            };

            _context.ProductVersions.Add(initialVersion);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product and initial version uploaded successfully!", productId = product.ProductId });
        }

        // 3. PUSH NEW UPDATE VERSION (For Sellers upgrading software/templates)
        [HttpPost("{productId}/add-version")]
        public async Task<IActionResult> AddNewVersion(int productId, [FromForm] AddVersionDto versionDto, IFormFile file)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound("Product listing not found.");

            if (file == null || file.Length == 0) return BadRequest("Updated file asset must be provided.");

            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            string uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

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
    }
}