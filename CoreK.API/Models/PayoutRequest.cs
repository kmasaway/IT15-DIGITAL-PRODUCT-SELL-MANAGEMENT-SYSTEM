using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreK.API.Models
{
    public class PayoutRequest
    {
        [Key]
        public int PayoutRequestId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(50)]
        public string PayoutMethod { get; set; } = "GCash";

        [Required]
        [StringLength(150)]
        public string PayoutAccountName { get; set; } = string.Empty;

        [Required]
        [StringLength(80)]
        public string PayoutAccountNumber { get; set; } = string.Empty;

        public DateTime? RangeStart { get; set; }

        public DateTime? RangeEnd { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending Review";

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        [ForeignKey("SellerId")]
        public User? Seller { get; set; }
    }
}
