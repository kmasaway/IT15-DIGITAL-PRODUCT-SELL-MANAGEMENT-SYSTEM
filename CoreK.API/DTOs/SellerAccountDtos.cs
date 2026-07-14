using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class UpdateValidIdStatusDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Remarks { get; set; }
    }

    public class UpdateSellerSubscriptionDto
    {
        [Required]
        [StringLength(50)]
        public string Plan { get; set; } = "Professional";

        [Required]
        [StringLength(50)]
        public string BillingCycle { get; set; } = "Monthly";

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string BillingEmail { get; set; } = string.Empty;

        [Range(1, 50)]
        public int Seats { get; set; } = 3;

        public bool AutoRenew { get; set; } = true;
    }
}
