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
    public class SupportTicketsController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public SupportTicketsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] int? customerId, [FromQuery] string? status)
        {
            try
            {
                var query = _context.SupportTickets
                    .Include(t => t.Product)
                    .Include(t => t.Order)
                    .AsQueryable();

                if (IsCustomer)
                {
                    query = query.Where(t => t.CustomerId == CurrentUserId);
                }
                else if (IsSeller)
                {
                    query = query.Where(t => t.Product != null && t.Product.SellerId == CurrentUserId);
                }
                else if (customerId.HasValue)
                {
                    query = query.Where(t => t.CustomerId == customerId.Value);
                }

                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(t => t.Status == status);
                }

                var tickets = await query
                    .OrderByDescending(t => t.UpdatedAt)
                    .Select(t => new
                    {
                        t.SupportTicketId,
                        t.CustomerId,
                        t.CustomerName,
                        t.CustomerEmail,
                        t.ProductId,
                        ProductTitle = t.Product == null ? null : t.Product.Title,
                        t.OrderId,
                        ReferenceNumber = t.Order == null ? null : t.Order.ReferenceNumber,
                        t.Subject,
                        t.Message,
                        t.Status,
                        t.Priority,
                        t.CreatedAt,
                        t.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(tickets);
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return Ok(Array.Empty<object>());
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Seller,Customer")]
        public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto)
        {
            var customerId = IsAdmin && dto.CustomerId > 0 ? dto.CustomerId : CurrentUserId;
            if (customerId <= 0)
            {
                return Unauthorized(new { message = "Your account session could not be verified. Please sign in again." });
            }

            var customer = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == customerId);
            if (customer == null)
            {
                return BadRequest("Customer account was not found.");
            }

            var ticketProductId = dto.ProductId;

            if (dto.OrderId.HasValue)
            {
                var order = await _context.Orders
                    .Include(o => o.Product)
                    .FirstOrDefaultAsync(o => o.OrderId == dto.OrderId.Value);
                if (order == null) return BadRequest("Selected order does not exist.");

                if (IsCustomer && order.CustomerId != CurrentUserId)
                {
                    return Forbid();
                }

                if (IsSeller && (order.Product == null || order.Product.SellerId != CurrentUserId))
                {
                    return Forbid();
                }

                if (ticketProductId.HasValue && ticketProductId.Value != order.ProductId)
                {
                    return BadRequest("Selected product does not match the selected order.");
                }

                ticketProductId = order.ProductId;
            }

            if (ticketProductId.HasValue)
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == ticketProductId.Value);
                if (product == null) return BadRequest("Selected product does not exist.");

                if (IsSeller && product.SellerId != CurrentUserId)
                {
                    return Forbid();
                }
            }

            var customerName = string.IsNullOrWhiteSpace(dto.CustomerName)
                ? customer.FullName.Trim()
                : dto.CustomerName.Trim();
            var customerEmail = string.IsNullOrWhiteSpace(dto.CustomerEmail)
                ? customer.Email.Trim()
                : dto.CustomerEmail.Trim();
            var subject = dto.Subject?.Trim() ?? string.Empty;
            var message = dto.Message?.Trim() ?? string.Empty;
            var priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority.Trim();

            if (string.IsNullOrWhiteSpace(customerName)
                || string.IsNullOrWhiteSpace(customerEmail)
                || string.IsNullOrWhiteSpace(subject)
                || string.IsNullOrWhiteSpace(message))
            {
                return BadRequest("Customer, subject, and message are required.");
            }

            var ticket = new SupportTicket
            {
                CustomerId = customerId,
                ProductId = ticketProductId,
                OrderId = dto.OrderId,
                CustomerName = customerName,
                CustomerEmail = customerEmail,
                Subject = subject,
                Message = message,
                Priority = priority,
                Status = "Open"
            };

            try
            {
                _context.SupportTickets.Add(ticket);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Support ticket storage is still being prepared. Please try again shortly." });
            }

            return Ok(new { message = "Support ticket submitted.", ticket.SupportTicketId });
        }

        [HttpPut("{ticketId}")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UpdateTicket(int ticketId, [FromBody] UpdateSupportTicketDto dto)
        {
            SupportTicket? ticket;

            try
            {
                ticket = await _context.SupportTickets
                    .Include(t => t.Product)
                    .FirstOrDefaultAsync(t => t.SupportTicketId == ticketId);
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Support ticket storage is still being prepared. Please try again shortly." });
            }

            if (ticket == null) return NotFound("Support ticket not found.");
            if (!IsAdmin && (ticket.Product == null || ticket.Product.SellerId != CurrentUserId)) return Forbid();

            ticket.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Open" : dto.Status.Trim();
            ticket.Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority.Trim();
            ticket.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Support ticket storage is still being prepared. Please try again shortly." });
            }

            return Ok(new { message = "Support ticket updated." });
        }
    }
}
