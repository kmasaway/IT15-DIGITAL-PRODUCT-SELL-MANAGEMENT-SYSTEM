using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Seller,Customer")]
    public class ReportsController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var productQuery = _context.Products.AsQueryable();
                var orderQuery = _context.Orders
                    .Include(o => o.Product)
                    .ThenInclude(p => p!.Category)
                    .AsQueryable();
                var ticketQuery = _context.SupportTickets
                    .Include(t => t.Product)
                    .AsQueryable();

                if (IsSeller)
                {
                    productQuery = productQuery.Where(p => p.SellerId == CurrentUserId);
                    orderQuery = orderQuery.Where(o => o.Product != null && o.Product.SellerId == CurrentUserId);
                    ticketQuery = ticketQuery.Where(t => t.Product != null && t.Product.SellerId == CurrentUserId);
                }
                else if (IsCustomer)
                {
                    orderQuery = orderQuery.Where(o => o.CustomerId == CurrentUserId);
                    ticketQuery = ticketQuery.Where(t => t.CustomerId == CurrentUserId);
                }

                var totalProducts = await productQuery.CountAsync();
                var activeProducts = await productQuery.CountAsync(p => p.IsActive);
                var totalCategories = await _context.Categories.CountAsync(c => !c.IsArchived);
                var totalOrders = await orderQuery.CountAsync();
                var completedOrders = await orderQuery.CountAsync(o => o.Status == "Completed");
                var totalSales = await orderQuery
                    .Where(o => o.Status == "Completed")
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
                var openTickets = await ticketQuery.CountAsync(t => t.Status != "Closed");

                var recentOrders = await orderQuery
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

                var salesByCategory = await orderQuery
                    .Where(o => o.Status == "Completed")
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

                var topProducts = await orderQuery
                    .Where(o => o.Status == "Completed")
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
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return Ok(new
                {
                    totalProducts = 0,
                    activeProducts = 0,
                    totalCategories = 0,
                    totalOrders = 0,
                    completedOrders = 0,
                    totalSales = 0m,
                    openTickets = 0,
                    recentOrders = Array.Empty<object>(),
                    salesByCategory = Array.Empty<object>(),
                    topProducts = Array.Empty<object>()
                });
            }
        }
    }
}
