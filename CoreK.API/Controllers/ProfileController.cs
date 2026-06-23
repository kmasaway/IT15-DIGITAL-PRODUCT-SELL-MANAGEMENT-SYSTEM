using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.DTOs;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User profile not found.");

            return Ok(new
            {
                user.UserId,
                user.FullName,
                user.Email,
                user.Role,
                user.PhoneNumber,
                user.Bio,
                user.PayoutMethod,
                user.PayoutAccountName,
                user.PayoutAccountNumber,
                user.IsTwoFactorEnabled,
                user.IsEmailVerified,
                user.CreatedAt
            });
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User profile not found.");

            var emailExists = await _context.Users.AnyAsync(u =>
                u.UserId != userId && u.Email == dto.Email);
            if (emailExists) return BadRequest("Email is already used by another account.");

            user.FullName = dto.FullName.Trim();
            user.Email = dto.Email.Trim();
            user.PhoneNumber = dto.PhoneNumber?.Trim();
            user.Bio = dto.Bio?.Trim();
            user.PayoutMethod = dto.PayoutMethod?.Trim();
            user.PayoutAccountName = dto.PayoutAccountName?.Trim();
            user.PayoutAccountNumber = dto.PayoutAccountNumber?.Trim();
            user.IsTwoFactorEnabled = dto.IsTwoFactorEnabled;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Profile settings saved.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.PhoneNumber,
                    user.Bio,
                    user.PayoutMethod,
                    user.PayoutAccountName,
                    user.PayoutAccountNumber,
                    user.IsTwoFactorEnabled
                }
            });
        }
    }
}
