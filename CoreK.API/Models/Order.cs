using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreK.API.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        public int CustomerId { get; set; } // Points to User.UserId (The buyer)

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string CustomerEmail { get; set; } = string.Empty;

        [StringLength(50)]
        public string PaymentMethod { get; set; } = "GCash";

        public string? PayMongoPaymentIntentId { get; set; } // Used to verify transactions via Webhooks

        [StringLength(80)]
        public string? ReferenceNumber { get; set; }

        [StringLength(120)]
        public string? DownloadToken { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }
    }
}
