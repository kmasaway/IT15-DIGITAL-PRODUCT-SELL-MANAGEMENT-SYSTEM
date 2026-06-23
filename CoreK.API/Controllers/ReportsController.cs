using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalProducts = await _context.Products.CountAsync();
            var activeProducts = await _context.Products.CountAsync(p => p.IsActive);
            var totalCategories = await _context.Categories.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();
            var completedOrders = await _context.Orders.CountAsync(o => o.Status == "Completed");
            var totalSales = await _context.Orders
                .Where(o => o.Status == "Completed")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
            var openTickets = await _context.SupportTickets.CountAsync(t => t.Status != "Closed");

            var recentOrders = await _context.Orders
                .Include(o => o.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new
                {
                    o.OrderId,
                    o.ReferenceNumber,
                    o.CustomerName,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt,
                    ProductTitle = o.Product == null ? "Deleted product" : o.Product.Title
                })
                .ToListAsync();

            var salesByCategory = await _context.Orders
                .Where(o => o.Status == "Completed")
                .Include(o => o.Product)
                .ThenInclude(p => p!.Category)
                .GroupBy(o => o.Product == null || o.Product.Category == null
                    ? "Digital Product"
                    : o.Product.Category.CategoryName)
                .Select(g => new
                {
                    Category = g.Key,
                    Sales = g.Sum(o => o.TotalAmount),
                    Orders = g.Count()
                })
                .OrderByDescending(g => g.Sales)
                .ToListAsync();

            var topProducts = await _context.Orders
                .Where(o => o.Status == "Completed")
                .Include(o => o.Product)
                .GroupBy(o => new
                {
                    o.ProductId,
                    Title = o.Product == null ? "Deleted product" : o.Product.Title
                })
                .Select(g => new
                {
                    g.Key.ProductId,
                    g.Key.Title,
                    Orders = g.Count(),
                    Sales = g.Sum(o => o.TotalAmount)
                })
                .OrderByDescending(g => g.Sales)
                .Take(5)
                .ToListAsync();

            return Ok(new
            {
                totalProducts,
                activeProducts,
                totalCategories,
                totalOrders,
                completedOrders,
                totalSales,
                openTickets,
                recentOrders,
                salesByCategory,
                topProducts
            });
        }
    }
}
