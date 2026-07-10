using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreK.API.Models
{
    public class ChatMessage
    {
        [Key]
        public int ChatMessageId { get; set; }

        [Required]
        public int SellerId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        public int? ProductId { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        [StringLength(150)]
        public string SenderName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string SenderRole { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }
    }
}
