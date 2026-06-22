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

        public string? PayMongoPaymentIntentId { get; set; } // Used to verify transactions via Webhooks

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Failed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}