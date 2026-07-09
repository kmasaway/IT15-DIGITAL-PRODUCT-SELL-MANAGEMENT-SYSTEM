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
    public class PaymentsController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("checkout")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> CreateCheckout([FromBody] CreatePaymentDto dto)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.ProductId == dto.ProductId && p.IsActive);

            if (product == null) return NotFound("Product is not available for checkout.");

            var referenceNumber = $"CK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            var order = new Order
            {
                CustomerId = IsAdmin && dto.CustomerId > 0 ? dto.CustomerId : CurrentUserId,
                ProductId = product.ProductId,
                CustomerName = dto.CustomerName.Trim(),
                CustomerEmail = dto.CustomerEmail.Trim(),
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "GCash" : dto.PaymentMethod.Trim(),
                PayMongoPaymentIntentId = $"paymongo_mock_{Guid.NewGuid():N}",
                ReferenceNumber = referenceNumber,
                DownloadToken = Guid.NewGuid().ToString("N"),
                TotalAmount = product.Price,
                Status = "Completed"
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var latestVersion = product.Versions
                .OrderByDescending(v => v.ReleaseDate)
                .FirstOrDefault();

            return Ok(new
            {
                message = "Payment recorded and digital access is ready.",
                order.OrderId,
                order.ReferenceNumber,
                order.DownloadToken,
                order.Status,
                order.TotalAmount,
                Product = new
                {
                    product.ProductId,
                    product.Title,
                    Category = product.Category?.CategoryName ?? "Digital Product",
                    LatestVersion = latestVersion?.VersionNumber ?? "1.0.0"
                }
            });
        }

        [HttpGet("orders")]
        [Authorize(Roles = "Admin,Seller,Customer")]
        public async Task<IActionResult> GetOrders([FromQuery] int? customerId)
        {
            var query = _context.Orders
                .Include(o => o.Product)
                .ThenInclude(p => p!.Category)
                .AsQueryable();

            if (IsCustomer)
            {
                query = query.Where(o => o.CustomerId == CurrentUserId);
            }
            else if (IsSeller)
            {
                query = query.Where(o => o.Product != null && o.Product.SellerId == CurrentUserId);
            }
            else if (customerId.HasValue)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.OrderId,
                    o.CustomerId,
                    o.CustomerName,
                    o.CustomerEmail,
                    o.PaymentMethod,
                    o.ReferenceNumber,
                    o.DownloadToken,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt,
                    ProductId = o.ProductId,
                    ProductTitle = o.Product == null ? "Deleted product" : o.Product.Title,
                    Category = o.Product == null || o.Product.Category == null
                        ? "Digital Product"
                        : o.Product.Category.CategoryName
                })
                .ToListAsync();

            return Ok(orders);
        }
    }
}
