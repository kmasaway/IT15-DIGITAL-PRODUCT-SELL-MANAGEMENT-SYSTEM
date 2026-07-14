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
        [AllowAnonymous]
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
                    CoverFilePath = p.Versions
                        .OrderBy(v => v.ReleaseDate)
                        .Select(v => v.SecureFilePath)
                        .FirstOrDefault(),
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

            var sellerProfiles = await GetSellerProfiles(products.Select(p => p.SellerId));

            return Ok(products.Select(p =>
            {
                sellerProfiles.TryGetValue(p.SellerId, out var seller);

                return new
                {
                    p.ProductId,
                    p.SellerId,
                    p.CategoryId,
                    p.Title,
                    p.Description,
                    p.Price,
                    p.IsActive,
                    p.CreatedAt,
                    SellerName = seller?.FullName,
                    SellerPhoneNumber = seller?.PhoneNumber,
                    SellerProfileName = seller?.FullName,
                    p.Category,
                    p.CategoryName,
                    p.VersionCount,
                    p.LatestVersion,
                    ThumbnailUrl = GetPublicAssetUrl(p.CoverFilePath),
                    CoverPhotoUrl = GetPublicAssetUrl(p.CoverFilePath),
                    p.Versions
                };
            }));
        }

        [HttpGet("{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProduct(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null) return NotFound("Product listing not found.");
            if (!product.IsActive && !IsAdmin && product.SellerId != CurrentUserId)
            {
                return NotFound("Product listing not found.");
            }

            var sellerProfile = await _context.Users
                .AsNoTracking()
                .Where(u => u.UserId == product.SellerId)
                .Select(u => new
                {
                    u.FullName,
                    u.PhoneNumber
                })
                .FirstOrDefaultAsync();

            return Ok(new
            {
                product.ProductId,
                product.SellerId,
                SellerName = sellerProfile?.FullName,
                SellerPhoneNumber = sellerProfile?.PhoneNumber,
                SellerProfileName = sellerProfile?.FullName,
                product.CategoryId,
                product.Title,
                product.Description,
                product.Price,
                product.IsActive,
                product.CreatedAt,
                Category = product.Category?.CategoryName ?? "Digital Product",
                CategoryName = product.Category?.CategoryName ?? "Digital Product",
                ThumbnailUrl = GetPublicAssetUrl(product.Versions
                    .OrderBy(v => v.ReleaseDate)
                    .Select(v => v.SecureFilePath)
                    .FirstOrDefault()),
                CoverPhotoUrl = GetPublicAssetUrl(product.Versions
                    .OrderBy(v => v.ReleaseDate)
                    .Select(v => v.SecureFilePath)
                    .FirstOrDefault()),
                Versions = product.Versions
                    .OrderByDescending(v => v.ReleaseDate)
                    .Select(v => new
                    {
                        v.VersionId,
                        v.VersionNumber,
                        v.Changelog,
                        v.ReleaseDate,
                        FileUrl = GetPublicAssetUrl(v.SecureFilePath)
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
                    p.SellerId,
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
                        .FirstOrDefault() ?? "1.0.0",
                    CoverFilePath = p.Versions
                        .OrderBy(v => v.ReleaseDate)
                        .Select(v => v.SecureFilePath)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var sellerProfiles = await GetSellerProfiles(products.Select(p => p.SellerId));

            return Ok(products.Select(p =>
            {
                sellerProfiles.TryGetValue(p.SellerId, out var seller);

                return new
                {
                    p.ProductId,
                    p.SellerId,
                    p.CategoryId,
                    p.Title,
                    p.Description,
                    p.Price,
                    p.IsActive,
                    p.CreatedAt,
                    SellerName = seller?.FullName,
                    SellerPhoneNumber = seller?.PhoneNumber,
                    SellerProfileName = seller?.FullName,
                    p.Category,
                    p.VersionCount,
                    p.LatestVersion,
                    ThumbnailUrl = GetPublicAssetUrl(p.CoverFilePath),
                    CoverPhotoUrl = GetPublicAssetUrl(p.CoverFilePath)
                };
            }));
        }

        [HttpPost("upload")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UploadProduct([FromForm] CreateProductDto productDto, [FromForm(Name = "file")] IFormFile? file)
        {
            var uploadedFile = file
                ?? Request.Form.Files.GetFile("file")
                ?? Request.Form.Files.GetFile("coverPhoto")
                ?? Request.Form.Files.FirstOrDefault();

            if (uploadedFile == null || uploadedFile.Length == 0)
                return BadRequest("A digital file asset must be provided.");

            var categoryName = await _context.Categories
                .Where(c => c.CategoryId == productDto.CategoryId)
                .Select(c => c.CategoryName)
                .FirstOrDefaultAsync();
            if (categoryName == null) return BadRequest("Invalid category specified.");

            var sellerId = IsAdmin && productDto.SellerId > 0 ? productDto.SellerId : CurrentUserId;
            if (sellerId <= 0)
            {
                return Unauthorized("Your seller session could not be verified. Please sign in again.");
            }

            var seller = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == sellerId);
            if (seller == null)
            {
                return BadRequest("Seller account was not found.");
            }

            if (!string.Equals(seller.Role, "Seller", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(seller.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Products can only be assigned to seller accounts.");
            }

            var title = productDto.Title?.Trim() ?? string.Empty;
            var description = productDto.Description?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
            {
                return BadRequest("Product title and description are required.");
            }

            string? savedFilePath = null;

            try
            {
                savedFilePath = await SaveUploadedAsset(uploadedFile);

                var product = new Product
                {
                    SellerId = sellerId,
                    CategoryId = productDto.CategoryId,
                    Title = title,
                    Description = description,
                    Price = productDto.Price,
                    IsActive = IsAdmin,
                    Versions =
                    [
                        new ProductVersion
                        {
                            VersionNumber = "1.0.0",
                            Changelog = "Initial Release Asset.",
                            SecureFilePath = savedFilePath
                        }
                    ]
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = product.IsActive
                        ? "Product and initial version uploaded successfully!"
                        : "Product submitted and waiting for admin validation.",
                    productId = product.ProductId,
                    status = product.IsActive ? "Approved" : "Pending Review",
                    product = new
                    {
                        product.ProductId,
                        product.SellerId,
                        product.CategoryId,
                        product.Title,
                        product.Description,
                        product.Price,
                        product.IsActive,
                        product.CreatedAt,
                        Category = categoryName,
                        CategoryName = categoryName,
                        SellerName = seller.FullName,
                        SellerPhoneNumber = seller.PhoneNumber,
                        SellerProfileName = seller.FullName,
                        VersionCount = 1,
                        LatestVersion = "1.0.0",
                        ThumbnailUrl = GetPublicAssetUrl(savedFilePath),
                        CoverPhotoUrl = GetPublicAssetUrl(savedFilePath)
                    }
                });
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                TryDeleteFile(savedFilePath);
                Console.WriteLine($">>> PRODUCT UPLOAD STORAGE ERROR: {ex.Message}");
                return StatusCode(503, new { message = "Product storage is still being prepared. Please try again shortly." });
            }
            catch (Exception ex)
            {
                TryDeleteFile(savedFilePath);
                Console.WriteLine($">>> PRODUCT UPLOAD ERROR: {ex.Message}");
                return StatusCode(500, new { message = "Unable to submit the product listing. Please try again." });
            }
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

            var title = productDto.Title?.Trim() ?? string.Empty;
            var description = productDto.Description?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description))
            {
                return BadRequest("Product title and description are required.");
            }

            product.CategoryId = productDto.CategoryId;
            product.Title = title;
            product.Description = description;
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
        public async Task<IActionResult> AddNewVersion(int productId, [FromForm] AddVersionDto versionDto, [FromForm(Name = "file")] IFormFile? file)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return NotFound("Product listing not found.");
            if (!IsAdmin && product.SellerId != CurrentUserId) return Forbid();

            var uploadedFile = file
                ?? Request.Form.Files.GetFile("file")
                ?? Request.Form.Files.FirstOrDefault();

            if (uploadedFile == null || uploadedFile.Length == 0) return BadRequest("Updated file asset must be provided.");

            var versionNumber = versionDto.VersionNumber?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(versionNumber))
            {
                return BadRequest("Version number is required.");
            }

            string? filePath = null;

            try
            {
                filePath = await SaveUploadedAsset(uploadedFile);

                var newVersion = new ProductVersion
                {
                    ProductId = productId,
                    VersionNumber = versionNumber,
                    Changelog = versionDto.Changelog?.Trim(),
                    SecureFilePath = filePath
                };

                _context.ProductVersions.Add(newVersion);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Version {versionNumber} pushed successfully!" });
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                TryDeleteFile(filePath);
                Console.WriteLine($">>> PRODUCT VERSION STORAGE ERROR: {ex.Message}");
                return StatusCode(503, new { message = "Product version storage is still being prepared. Please try again shortly." });
            }
            catch (Exception ex)
            {
                TryDeleteFile(filePath);
                Console.WriteLine($">>> PRODUCT VERSION ERROR: {ex.Message}");
                return StatusCode(500, new { message = "Unable to push the product version. Please try again." });
            }
        }

        private async Task<Dictionary<int, SellerProfile>> GetSellerProfiles(IEnumerable<int> sellerIds)
        {
            var ids = sellerIds
                .Distinct()
                .ToList();

            return await _context.Users
                .AsNoTracking()
                .Where(u => ids.Contains(u.UserId))
                .Select(u => new SellerProfile(
                    u.UserId,
                    u.FullName,
                    u.PhoneNumber))
                .ToDictionaryAsync(s => s.UserId);
        }

        private sealed record SellerProfile(int UserId, string FullName, string? PhoneNumber);

        private async Task<string> SaveUploadedAsset(IFormFile file)
        {
            string uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            string safeFileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(safeFileName))
            {
                safeFileName = "product-upload.bin";
            }

            string uniqueFileName = $"{Guid.NewGuid()}_{safeFileName}";
            string filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            return filePath;
        }

        private static void TryDeleteFile(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath) || !System.IO.File.Exists(filePath))
            {
                return;
            }

            try
            {
                System.IO.File.Delete(filePath);
            }
            catch
            {
                // Best-effort cleanup only; the API response should still reflect the original failure.
            }
        }

        private static string? GetPublicAssetUrl(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return null;
            }

            if (Uri.TryCreate(filePath, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            {
                return filePath;
            }

            var fileName = Path.GetFileName(filePath);
            return string.IsNullOrWhiteSpace(fileName)
                ? null
                : $"/uploads/{Uri.EscapeDataString(fileName)}";
        }
    }
}
