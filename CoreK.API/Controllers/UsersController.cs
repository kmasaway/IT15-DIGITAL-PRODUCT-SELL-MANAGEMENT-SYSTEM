using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            object users;

            try
            {
                users = await _context.Users
                    .OrderByDescending(u => u.CreatedAt)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.Role,
                        u.IsEmailVerified,
                        u.CreatedAt,
                        ValidIdStatus = _context.ValidIdSubmissions
                            .Where(v => v.UserId == u.UserId)
                            .Select(v => v.Status)
                            .FirstOrDefault(),
                        SubscriptionPlan = _context.SellerSubscriptions
                            .Where(s => s.SellerId == u.UserId)
                            .Select(s => s.Plan)
                            .FirstOrDefault(),
                        SubscriptionSeats = _context.SellerSubscriptions
                            .Where(s => s.SellerId == u.UserId)
                            .Select(s => (int?)s.Seats)
                            .FirstOrDefault(),
                        ProductCount = _context.Products.Count(p => p.SellerId == u.UserId),
                        OrderCount = _context.Orders.Count(o => o.CustomerId == u.UserId),
                        TicketCount = _context.SupportTickets.Count(t => t.CustomerId == u.UserId)
                    })
                    .ToListAsync();
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                users = await _context.Users
                    .OrderByDescending(u => u.CreatedAt)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.Role,
                        u.IsEmailVerified,
                        u.CreatedAt,
                        ValidIdStatus = (string?)null,
                        SubscriptionPlan = (string?)null,
                        SubscriptionSeats = (int?)null,
                        ProductCount = _context.Products.Count(p => p.SellerId == u.UserId),
                        OrderCount = _context.Orders.Count(o => o.CustomerId == u.UserId),
                        TicketCount = _context.SupportTickets.Count(t => t.CustomerId == u.UserId)
                    })
                    .ToListAsync();
            }

            return Ok(users);
        }
    }
}
