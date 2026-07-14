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

            var fullName = dto.FullName?.Trim() ?? string.Empty;
            var email = dto.Email?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Full name and email are required.");
            }

            var emailExists = await _context.Users.AnyAsync(u =>
                u.UserId != userId && u.Email == email);
            if (emailExists) return BadRequest("Email is already used by another account.");

            var phoneNumber = dto.PhoneNumber?.Trim();
            if (!string.IsNullOrWhiteSpace(phoneNumber) && !Regex.IsMatch(phoneNumber, @"^09\d{9}$"))
            {
                return BadRequest("Phone must be a Philippine mobile number using the 09XXXXXXXXX format.");
            }

            user.FullName = fullName;
            user.Email = email;
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

            var currentPassword = dto.CurrentPassword ?? string.Empty;
            var newPassword = dto.NewPassword ?? string.Empty;
            var confirmPassword = dto.ConfirmPassword ?? string.Empty;

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                return BadRequest("Current password is incorrect.");
            }

            if (newPassword != confirmPassword)
            {
                return BadRequest("Password confirmation does not match.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
