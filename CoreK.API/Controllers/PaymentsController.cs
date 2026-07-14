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
            if (dto.ProductId <= 0)
            {
                return BadRequest(new { message = "Select a product for checkout." });
            }

            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Versions)
                .FirstOrDefaultAsync(p => p.ProductId == dto.ProductId && p.IsActive);

            if (product == null) return NotFound("Product is not available for checkout.");

            var customerId = IsAdmin && dto.CustomerId > 0 ? dto.CustomerId : CurrentUserId;
            if (customerId <= 0)
            {
                return Unauthorized(new { message = "Your customer session could not be verified. Please sign in again." });
            }

            var customer = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == customerId);
            if (customer == null)
            {
                return BadRequest(new { message = "Customer account was not found." });
            }

            var customerName = string.IsNullOrWhiteSpace(dto.CustomerName)
                ? customer.FullName.Trim()
                : dto.CustomerName.Trim();
            var customerEmail = string.IsNullOrWhiteSpace(dto.CustomerEmail)
                ? customer.Email.Trim()
                : dto.CustomerEmail.Trim();

            if (string.IsNullOrWhiteSpace(customerName) || string.IsNullOrWhiteSpace(customerEmail))
            {
                return BadRequest(new { message = "Customer name and email are required for checkout." });
            }

            var referenceNumber = $"CK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            var order = new Order
            {
                CustomerId = customerId,
                ProductId = product.ProductId,
                CustomerName = customerName,
                CustomerEmail = customerEmail,
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

            var orderRows = await query
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
                    SellerId = o.Product == null ? (int?)null : o.Product.SellerId,
                    Category = o.Product == null || o.Product.Category == null
                        ? "Digital Product"
                        : o.Product.Category.CategoryName
                })
                .ToListAsync();

            var sellerIds = orderRows
                .Where(o => o.SellerId.HasValue)
                .Select(o => o.SellerId!.Value)
                .Distinct()
                .ToList();

            var sellerProfiles = await _context.Users
                .AsNoTracking()
                .Where(u => sellerIds.Contains(u.UserId))
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.PhoneNumber
                })
                .ToDictionaryAsync(u => u.UserId);

            var orders = orderRows.Select(o =>
            {
                var sellerId = o.SellerId ?? 0;
                sellerProfiles.TryGetValue(sellerId, out var seller);
                var sellerName = seller?.FullName
                    ?? (sellerId > 0 ? $"Seller #{sellerId}" : "Seller User");

                return new
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
                    o.ProductId,
                    o.ProductTitle,
                    SellerId = sellerId,
                    SellerName = sellerName,
                    SellerPhoneNumber = seller?.PhoneNumber,
                    SellerProfileName = sellerName,
                    o.Category
                };
            });

            return Ok(orders);
        }

        [HttpGet("payouts")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> GetPayouts([FromQuery] int? sellerId)
        {
            try
            {
                var query = _context.PayoutRequests
                    .Include(p => p.Seller)
                    .AsQueryable();

                if (IsSeller)
                {
                    query = query.Where(p => p.SellerId == CurrentUserId);
                }
                else if (sellerId.HasValue)
                {
                    query = query.Where(p => p.SellerId == sellerId.Value);
                }

                var payouts = await query
                    .OrderByDescending(p => p.RequestedAt)
                    .ToListAsync();

                return Ok(payouts.Select(p => ToPayoutResponse(p)));
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return Ok(Array.Empty<object>());
            }
        }

        [HttpPost("payouts")]
        [Authorize(Roles = "Seller")]
        public async Task<IActionResult> CreatePayoutRequest([FromBody] CreatePayoutRequestDto dto)
        {
            var seller = await _context.Users.FirstOrDefaultAsync(u => u.UserId == CurrentUserId);
            if (seller == null) return Unauthorized(new { message = "Seller account was not found." });

            if (string.IsNullOrWhiteSpace(seller.PayoutAccountName) ||
                string.IsNullOrWhiteSpace(seller.PayoutAccountNumber))
            {
                return BadRequest(new { message = "Complete your payout account details before requesting a payout." });
            }

            var startDate = dto.StartDate?.Date;
            var endDate = dto.EndDate?.Date;

            if (startDate.HasValue && endDate.HasValue && startDate.Value > endDate.Value)
            {
                return BadRequest(new { message = "The payout start date must be before the end date." });
            }

            bool hasPendingRequest;

            try
            {
                hasPendingRequest = await _context.PayoutRequests.AnyAsync(p =>
                    p.SellerId == CurrentUserId && p.Status == "Pending Review");
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Payout storage is still being prepared. Please try again shortly." });
            }

            if (hasPendingRequest)
            {
                return Conflict(new { message = "You already have a payout request pending admin review." });
            }

            var completedOrdersQuery = _context.Orders
                .Include(o => o.Product)
                .Where(o => o.Product != null &&
                    o.Product.SellerId == CurrentUserId &&
                    o.Status == "Completed");

            if (startDate.HasValue)
            {
                completedOrdersQuery = completedOrdersQuery.Where(o => o.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                var exclusiveEndDate = endDate.Value.AddDays(1);
                completedOrdersQuery = completedOrdersQuery.Where(o => o.CreatedAt < exclusiveEndDate);
            }

            var payoutAmount = await completedOrdersQuery.SumAsync(o => o.TotalAmount);
            if (payoutAmount <= 0)
            {
                return BadRequest(new { message = "No completed sales are available for payout in the selected date range." });
            }

            var payoutRequest = new PayoutRequest
            {
                SellerId = CurrentUserId,
                Amount = payoutAmount,
                PayoutMethod = string.IsNullOrWhiteSpace(seller.PayoutMethod) ? "GCash" : seller.PayoutMethod.Trim(),
                PayoutAccountName = seller.PayoutAccountName.Trim(),
                PayoutAccountNumber = seller.PayoutAccountNumber.Trim(),
                RangeStart = startDate,
                RangeEnd = endDate,
                Status = "Pending Review",
                RequestedAt = DateTime.UtcNow
            };

            try
            {
                _context.PayoutRequests.Add(payoutRequest);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Payout storage is still being prepared. Please try again shortly." });
            }

            return Ok(new
            {
                message = "Payout request submitted for admin processing.",
                payout = ToPayoutResponse(payoutRequest, seller.FullName)
            });
        }

        [HttpPut("payouts/{payoutRequestId:int}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePayoutStatus(int payoutRequestId, [FromBody] UpdatePayoutStatusDto dto)
        {
            var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Pending Review",
                "Approved",
                "Released",
                "Rejected"
            };

            var requestedStatus = dto.Status?.Trim() ?? string.Empty;
            if (!allowedStatuses.Contains(requestedStatus))
            {
                return BadRequest(new { message = "Payout status must be Pending Review, Approved, Released, or Rejected." });
            }

            PayoutRequest? payoutRequest;

            try
            {
                payoutRequest = await _context.PayoutRequests
                    .Include(p => p.Seller)
                    .FirstOrDefaultAsync(p => p.PayoutRequestId == payoutRequestId);
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Payout storage is still being prepared. Please try again shortly." });
            }

            if (payoutRequest == null) return NotFound(new { message = "Payout request was not found." });

            payoutRequest.Status = allowedStatuses.First(status =>
                status.Equals(requestedStatus, StringComparison.OrdinalIgnoreCase));
            payoutRequest.ReviewedAt = payoutRequest.Status == "Pending Review" ? null : DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Payout storage is still being prepared. Please try again shortly." });
            }

            return Ok(new
            {
                message = "Payout status updated.",
                payout = ToPayoutResponse(payoutRequest)
            });
        }

        private static object ToPayoutResponse(PayoutRequest request, string? sellerName = null)
        {
            return new
            {
                request.PayoutRequestId,
                request.SellerId,
                SellerName = sellerName ?? request.Seller?.FullName ?? $"Seller #{request.SellerId}",
                request.Amount,
                request.PayoutMethod,
                request.PayoutAccountName,
                request.PayoutAccountNumber,
                request.RangeStart,
                request.RangeEnd,
                request.Status,
                request.RequestedAt,
                request.ReviewedAt
            };
        }
    }
}
