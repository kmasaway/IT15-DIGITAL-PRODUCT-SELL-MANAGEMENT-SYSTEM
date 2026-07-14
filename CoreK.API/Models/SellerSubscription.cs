using System.ComponentModel.DataAnnotations;

namespace CoreK.API.Models
{
    public class SellerSubscription
    {
        public int SellerSubscriptionId { get; set; }

        public int SellerId { get; set; }

        public User? Seller { get; set; }

        [Required]
        [StringLength(50)]
        public string Plan { get; set; } = "Professional";

        [Required]
        [StringLength(50)]
        public string BillingCycle { get; set; } = "Monthly";

        [Required]
        [StringLength(150)]
        public string BillingEmail { get; set; } = string.Empty;

        public int Seats { get; set; } = 3;

        public bool AutoRenew { get; set; } = true;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
