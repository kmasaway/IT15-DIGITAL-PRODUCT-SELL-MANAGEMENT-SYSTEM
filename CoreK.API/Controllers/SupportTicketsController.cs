using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.DTOs;
using CoreK.API.Models;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupportTicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SupportTicketsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets([FromQuery] int? customerId, [FromQuery] string? status)
        {
            var query = _context.SupportTickets
                .Include(t => t.Product)
                .Include(t => t.Order)
                .AsQueryable();

            if (customerId.HasValue)
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

        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto)
        {
            if (dto.ProductId.HasValue)
            {
                var productExists = await _context.Products.AnyAsync(p => p.ProductId == dto.ProductId.Value);
                if (!productExists) return BadRequest("Selected product does not exist.");
            }

            if (dto.OrderId.HasValue)
            {
                var orderExists = await _context.Orders.AnyAsync(o => o.OrderId == dto.OrderId.Value);
                if (!orderExists) return BadRequest("Selected order does not exist.");
            }

            var ticket = new SupportTicket
            {
                CustomerId = dto.CustomerId <= 0 ? 1 : dto.CustomerId,
                ProductId = dto.ProductId,
                OrderId = dto.OrderId,
                CustomerName = dto.CustomerName.Trim(),
                CustomerEmail = dto.CustomerEmail.Trim(),
                Subject = dto.Subject.Trim(),
                Message = dto.Message.Trim(),
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority.Trim(),
                Status = "Open"
            };

            _context.SupportTickets.Add(ticket);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Support ticket submitted.", ticket.SupportTicketId });
        }

        [HttpPut("{ticketId}")]
        public async Task<IActionResult> UpdateTicket(int ticketId, [FromBody] UpdateSupportTicketDto dto)
        {
            var ticket = await _context.SupportTickets.FindAsync(ticketId);
            if (ticket == null) return NotFound("Support ticket not found.");

            ticket.Status = dto.Status.Trim();
            ticket.Priority = dto.Priority.Trim();
            ticket.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Support ticket updated." });
        }
    }
}
