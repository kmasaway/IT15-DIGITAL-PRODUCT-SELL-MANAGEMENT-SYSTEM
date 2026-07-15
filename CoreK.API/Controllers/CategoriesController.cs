using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.DTOs;
using CoreK.API.Models;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoriesController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Where(c => !c.IsArchived)
                .OrderBy(c => c.CategoryName)
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.Description,
                    c.IsArchived,
                    ProductCount = _context.Products.Count(p => p.CategoryId == c.CategoryId)
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            var categoryName = dto.CategoryName?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return BadRequest("Category name is required.");
            }

            var exists = await _context.Categories.AnyAsync(c =>
                !c.IsArchived && c.CategoryName.ToLower() == categoryName.ToLower());
            if (exists) return BadRequest("Category name already exists.");

            var category = new Category
            {
                CategoryName = categoryName,
                Description = dto.Description?.Trim(),
                IsArchived = false
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpPut("{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int categoryId, [FromBody] UpdateCategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null) return NotFound("Category not found.");

            var categoryName = dto.CategoryName?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(categoryName))
            {
                return BadRequest("Category name is required.");
            }

            var exists = await _context.Categories.AnyAsync(c =>
                c.CategoryId != categoryId && !c.IsArchived && c.CategoryName.ToLower() == categoryName.ToLower());
            if (exists) return BadRequest("Category name already exists.");

            category.CategoryName = categoryName;
            category.Description = dto.Description?.Trim();
            category.IsArchived = false;
            await _context.SaveChangesAsync();

            return Ok(category);
        }

        [HttpDelete("{categoryId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int categoryId)
        {
            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null) return NotFound("Category not found.");

            category.IsArchived = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Category archived successfully." });
        }
    }
}
