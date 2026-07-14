using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.DTOs;
using System.Text.RegularExpressions;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            if (!IsSelfOrAdmin(userId)) return Forbid();

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
                user.IsEmailVerified,
                user.CreatedAt
            });
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
        {
            if (!IsSelfOrAdmin(userId)) return Forbid();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User profile not found.");

            var emailExists = await _context.Users.AnyAsync(u =>
                u.UserId != userId && u.Email == dto.Email);
            if (emailExists) return BadRequest("Email is already used by another account.");

            var phoneNumber = dto.PhoneNumber?.Trim();
            if (!string.IsNullOrWhiteSpace(phoneNumber) && !Regex.IsMatch(phoneNumber, @"^09\d{9}$"))
            {
                return BadRequest("Phone must be a Philippine mobile number using the 09XXXXXXXXX format.");
            }

            user.FullName = dto.FullName.Trim();
            user.Email = dto.Email.Trim();
            user.PhoneNumber = phoneNumber;
            user.Bio = dto.Bio?.Trim();
            user.PayoutMethod = dto.PayoutMethod?.Trim();
            user.PayoutAccountName = dto.PayoutAccountName?.Trim();
            user.PayoutAccountNumber = dto.PayoutAccountNumber?.Trim();
            user.IsTwoFactorEnabled = false;
            user.TwoFactorSecret = null;

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
                    user.PayoutAccountNumber
                }
            });
        }

        [HttpPut("{userId}/password")]
        public async Task<IActionResult> ChangePassword(int userId, [FromBody] ChangePasswordDto dto)
        {
            if (!IsSelfOrAdmin(userId)) return Forbid();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User profile not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest("Password confirmation does not match.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
