using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role,
                    u.IsEmailVerified,
                    u.IsTwoFactorEnabled,
                    u.CreatedAt,
                    ProductCount = _context.Products.Count(p => p.SellerId == u.UserId),
                    OrderCount = _context.Orders.Count(o => o.CustomerId == u.UserId),
                    TicketCount = _context.SupportTickets.Count(t => t.CustomerId == u.UserId)
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}
