using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(30)]
        public string? PhoneNumber { get; set; }

        [StringLength(500)]
        public string? Bio { get; set; }

        [StringLength(50)]
        public string? PayoutMethod { get; set; }

        [StringLength(150)]
        public string? PayoutAccountName { get; set; }

        [StringLength(80)]
        public string? PayoutAccountNumber { get; set; }

    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare(nameof(NewPassword), ErrorMessage = "Password confirmation does not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
