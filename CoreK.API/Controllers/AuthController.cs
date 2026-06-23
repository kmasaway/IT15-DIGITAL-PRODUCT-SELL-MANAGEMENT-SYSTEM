using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CoreK.API.Data;
using CoreK.API.Models;
using CoreK.API.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly EmailSender _emailSender;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _emailSender = new EmailSender(configuration);
        }

        // 1. REGISTER ENDPOINT
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest("Email is already registered.");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            string verificationCode = Random.Shared.Next(100000, 999999).ToString();

            var newUser = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = dto.Role,
                IsEmailVerified = false, 
                EmailVerificationToken = verificationCode
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            try
            {
                await _emailSender.SendVerificationCodeAsync(newUser.Email, verificationCode);
                Console.WriteLine(">>> SUCCESS: Email verification code sent via SMTP.");
                return Ok(new { message = "Registration successful! Enter the 6-digit code sent to your email.", requiresVerification = true, email = newUser.Email });
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> SMTP REGISTER ERROR: {ex.Message}");

                _context.Users.Remove(newUser);
                await _context.SaveChangesAsync();

                return StatusCode(500, new
                {
                    message = "Registration could not continue because email verification is not configured. Please set EmailSettings:SenderEmail and EmailSettings:AppPassword in the API settings."
                });
            }
        }

        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyEmailCode([FromBody] VerifyEmailCodeDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
            {
                return BadRequest("No account was found for this email address.");
            }

            if (user.IsEmailVerified)
            {
                return Ok(new { message = "This account is already verified. You can now sign in." });
            }

            if (user.EmailVerificationToken != dto.Code.Trim())
            {
                return BadRequest("Invalid verification code. Please check your email and try again.");
            }

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            await _context.SaveChangesAsync();

            try
            {
                await _emailSender.SendWelcomeConfirmationEmailAsync(user.Email, user.FullName);
                Console.WriteLine($">>> SUCCESS: Verification confirmation sent to active user: {user.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> SMTP CONFIRMATION ERROR: {ex.Message}");
            }

            return Ok(new { message = "Email verified successfully! You can now sign in." });
        }

        // 2. VERIFY EMAIL ENDPOINT (Now fires second verification confirmation email)
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token)) 
            {
                return BadRequest("Invalid email confirmation context routing.");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
            if (user == null)
            {
                return BadRequest("Verification signature token is invalid or has expired.");
            }

            // Flip database flags to remove user login gate restrictions
            user.IsEmailVerified = true;
            user.EmailVerificationToken = null; 
            await _context.SaveChangesAsync();

            // AUTOMATION STEP: Fire a welcome confirmation message back to their Gmail inbox live
            try
            {
                await _emailSender.SendWelcomeConfirmationEmailAsync(user.Email, user.FullName);
                Console.WriteLine($">>> SUCCESS: Verification confirmation sent to active user: {user.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> SMTP CONFIRMATION ERROR: {ex.Message}");
            }

            return Content("<h3>Email Registry Cleared!</h3><p>Your identity signature has been fully authorized. A final confirmation details message has been sent to your inbox. You can close this window and log in.</p>", "text/html");
        }

        // 3. LOGIN ENDPOINT
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password.");
            }

            if (!user.IsEmailVerified)
            {
                return BadRequest("Please verify your account using the 6-digit code sent to your email before signing in.");
            }

            var token = CreateJwtToken(user);

            return Ok(new { 
                token = token,
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

        private string CreateJwtToken(User user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role) 
            };

            var keyStr = _configuration.GetSection("AppSettings:TokenSecret").Value;
            if (string.IsNullOrEmpty(keyStr)) keyStr = "SuperSecretDefaultKeyThatIsLongEnoughToMeetSecurityRequirements123!";
            
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1), 
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}
