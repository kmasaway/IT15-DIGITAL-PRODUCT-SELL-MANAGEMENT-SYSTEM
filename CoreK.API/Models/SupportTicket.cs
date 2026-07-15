using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreK.API.Models
{
    public class SupportTicket
    {
        [Key]
        public int SupportTicketId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        public int? ProductId { get; set; }

        public int? OrderId { get; set; }

        [Required]
        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string CustomerEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(160)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Open";

        [Required]
        [StringLength(50)]
        public string Priority { get; set; } = "Normal";

        [Required]
        [StringLength(50)]
        public string RequesterRole { get; set; } = "Customer";

        [StringLength(500)]
        public string? ReviewRemarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [ForeignKey("OrderId")]
        public Order? Order { get; set; }
    }
}
