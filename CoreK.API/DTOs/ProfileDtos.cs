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

        public bool IsTwoFactorEnabled { get; set; }
    }
}
