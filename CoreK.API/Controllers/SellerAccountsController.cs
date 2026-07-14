using CoreK.API.Data;
using CoreK.API.DTOs;
using CoreK.API.Models;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreK.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SellerAccountsController : CoreKControllerBase
    {
        private static readonly string[] AllowedIdTypes =
        [
            "National ID",
            "Driver's License",
            "Passport",
            "UMID"
        ];

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public SellerAccountsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet("valid-ids")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetValidIds()
        {
            List<ValidIdSubmission> submissions;

            try
            {
                submissions = await _context.ValidIdSubmissions
                    .Include(v => v.User)
                    .OrderByDescending(v => v.SubmittedAt)
                    .ToListAsync();
            }
            catch (Exception ex) when (IsMissingSellerAccountStorage(ex))
            {
                return Ok(Array.Empty<object>());
            }

            return Ok(submissions.Select(ToValidIdResponse));
        }

        [HttpGet("{userId}/valid-id")]
        [Authorize(Roles = "Admin,Seller,Customer")]
        public async Task<IActionResult> GetValidId(int userId)
        {
            if (!IsSelfOrAdmin(userId)) return Forbid();

            ValidIdSubmission? submission;

            try
            {
                submission = await _context.ValidIdSubmissions
                    .Include(v => v.User)
                    .FirstOrDefaultAsync(v => v.UserId == userId);
            }
            catch (Exception ex) when (IsMissingSellerAccountStorage(ex))
            {
                return Ok(null);
            }

            return Ok(submission == null ? null : ToValidIdResponse(submission));
        }

        [HttpPost("{userId}/valid-id")]
        [Authorize(Roles = "Admin,Seller,Customer")]
        public async Task<IActionResult> SubmitValidId(
            int userId,
            [FromForm] string idType,
            [FromForm] string idNumber,
            [FromForm(Name = "file")] IFormFile? file)
        {
            if (!IsSelfOrAdmin(userId)) return Forbid();

            var normalizedIdType = idType?.Trim() ?? string.Empty;
            if (!AllowedIdTypes.Contains(normalizedIdType, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest("Select a supported government ID type.");
            }

            if (string.IsNullOrWhiteSpace(idNumber))
            {
                return BadRequest("Valid ID number is required.");
            }

            var uploadedFile = file ?? Request.Form.Files.FirstOrDefault();
            if (uploadedFile == null || uploadedFile.Length == 0)
            {
                return BadRequest("Valid ID file attachment is required.");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User account was not found.");

            var savedFilePath = await SaveUploadedAsset(uploadedFile);

            ValidIdSubmission? existingSubmission;

            try
            {
                existingSubmission = await _context.ValidIdSubmissions
                    .FirstOrDefaultAsync(v => v.UserId == userId);
            }
            catch (Exception ex) when (IsMissingSellerAccountStorage(ex))
            {
                return StatusCode(503, new { message = "Valid ID storage is still being prepared. Please try again shortly." });
            }

            if (existingSubmission == null)
            {
                existingSubmission = new ValidIdSubmission
                {
                    UserId = userId
                };
                _context.ValidIdSubmissions.Add(existingSubmission);
            }

            existingSubmission.IdType = normalizedIdType;
            existingSubmission.IdNumber = idNumber.Trim();
            existingSubmission.FileName = Path.GetFileName(uploadedFile.FileName);
            existingSubmission.FilePath = savedFilePath;
            existingSubmission.Status = "Pending Review";
            existingSubmission.Remarks = null;
            existingSubmission.SubmittedAt = DateTime.UtcNow;
            existingSubmission.ReviewedAt = null;

            await _context.SaveChangesAsync();
            await _context.Entry(existingSubmission).Reference(v => v.User).LoadAsync();

            return Ok(new
            {
                message = "ID Submitted waiting for verification then the admin will check.",
                validId = ToValidIdResponse(existingSubmission)
            });
        }

        [HttpPut("valid-ids/{validIdSubmissionId}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateValidIdStatus(int validIdSubmissionId, [FromBody] UpdateValidIdStatusDto dto)
        {
            var submission = await _context.ValidIdSubmissions
                .Include(v => v.User)
                .FirstOrDefaultAsync(v => v.ValidIdSubmissionId == validIdSubmissionId);
            if (submission == null) return NotFound("Valid ID submission was not found.");

            var status = dto.Status.Trim();
            if (!string.Equals(status, "Verified", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(status, "Pending Review", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Unsupported valid ID status.");
            }

            if (string.Equals(status, "Rejected", StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrWhiteSpace(dto.Remarks))
            {
                return BadRequest("Remarks are required when rejecting a valid ID.");
            }

            submission.Status = status;
            submission.Remarks = dto.Remarks?.Trim();
            submission.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = status.Equals("Verified", StringComparison.OrdinalIgnoreCase)
                    ? "Valid ID accepted."
                    : status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)
                        ? "Valid ID rejected."
                        : "Valid ID review updated.",
                validId = ToValidIdResponse(submission)
            });
        }

        [HttpGet("{sellerId}/subscription")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> GetSubscription(int sellerId)
        {
            if (!IsSelfOrAdmin(sellerId)) return Forbid();

            var seller = await _context.Users.FindAsync(sellerId);
            if (seller == null) return NotFound("Seller account was not found.");

            SellerSubscription subscription;

            try
            {
                subscription = await GetOrCreateSubscription(seller);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex) when (IsMissingSellerAccountStorage(ex))
            {
                subscription = CreateDefaultSubscription(seller);
            }

            return Ok(ToSubscriptionResponse(subscription));
        }

        [HttpPut("{sellerId}/subscription")]
        [Authorize(Roles = "Admin,Seller")]
        public async Task<IActionResult> UpdateSubscription(int sellerId, [FromBody] UpdateSellerSubscriptionDto dto)
        {
            if (!IsSelfOrAdmin(sellerId)) return Forbid();

            var seller = await _context.Users.FindAsync(sellerId);
            if (seller == null) return NotFound("Seller account was not found.");

            var allowedPlans = new[] { "Starter", "Professional", "Enterprise" };
            var allowedCycles = new[] { "Monthly", "Quarterly", "Annual" };
            if (!allowedPlans.Contains(dto.Plan, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest("Unsupported subscription plan.");
            }

            if (!allowedCycles.Contains(dto.BillingCycle, StringComparer.OrdinalIgnoreCase))
            {
                return BadRequest("Unsupported billing cycle.");
            }

            SellerSubscription subscription;

            try
            {
                subscription = await GetOrCreateSubscription(seller);
            }
            catch (Exception ex) when (IsMissingSellerAccountStorage(ex))
            {
                return StatusCode(503, new { message = "Subscription storage is still being prepared. Please try again shortly." });
            }

            subscription.Plan = dto.Plan.Trim();
            subscription.BillingCycle = dto.BillingCycle.Trim();
            subscription.BillingEmail = dto.BillingEmail.Trim();
            subscription.Seats = dto.Seats;
            subscription.AutoRenew = dto.AutoRenew;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "ERP subscription settings were updated.",
                subscription = ToSubscriptionResponse(subscription)
            });
        }

        private static SellerSubscription CreateDefaultSubscription(User seller)
        {
            return new SellerSubscription
            {
                SellerId = seller.UserId,
                BillingEmail = seller.Email
            };
        }

        private async Task<SellerSubscription> GetOrCreateSubscription(User seller)
        {
            var subscription = await _context.SellerSubscriptions
                .FirstOrDefaultAsync(s => s.SellerId == seller.UserId);

            if (subscription != null) return subscription;

            subscription = new SellerSubscription
            {
                SellerId = seller.UserId,
                BillingEmail = seller.Email
            };
            _context.SellerSubscriptions.Add(subscription);
            return subscription;
        }

        private async Task<string> SaveUploadedAsset(IFormFile file)
        {
            var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var safeFileName = Path.GetFileName(file.FileName);
            if (string.IsNullOrWhiteSpace(safeFileName))
            {
                safeFileName = "valid-id-upload.bin";
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{safeFileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            await using var fileStream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(fileStream);

            return filePath;
        }

        private static object ToValidIdResponse(ValidIdSubmission submission)
        {
            return new
            {
                submission.ValidIdSubmissionId,
                submission.UserId,
                FullName = submission.User?.FullName,
                Email = submission.User?.Email,
                submission.IdType,
                submission.IdNumber,
                submission.FileName,
                FileUrl = GetPublicAssetUrl(submission.FilePath),
                submission.Status,
                submission.Remarks,
                submission.SubmittedAt,
                submission.ReviewedAt
            };
        }

        private static object ToSubscriptionResponse(SellerSubscription subscription)
        {
            return new
            {
                subscription.SellerSubscriptionId,
                subscription.SellerId,
                subscription.Plan,
                subscription.BillingCycle,
                subscription.BillingEmail,
                subscription.Seats,
                subscription.AutoRenew,
                subscription.UpdatedAt
            };
        }

        private static bool IsMissingSellerAccountStorage(Exception exception)
        {
            var currentException = exception;

            while (currentException != null)
            {
                if (currentException is SqlException sqlException
                    && sqlException.Errors.Cast<SqlError>().Any(error => error.Number is 207 or 208))
                {
                    return true;
                }

                currentException = currentException.InnerException;
            }

            return false;
        }

        private static string? GetPublicAssetUrl(string? filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath)) return null;

            if (Uri.TryCreate(filePath, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            {
                return filePath;
            }

            var fileName = Path.GetFileName(filePath);
            return string.IsNullOrWhiteSpace(fileName)
                ? null
                : $"/uploads/{Uri.EscapeDataString(fileName)}";
        }
    }
}
