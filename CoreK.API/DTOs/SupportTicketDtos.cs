using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreateSupportTicketDto
    {
        public int CustomerId { get; set; } = 1;

        public int? ProductId { get; set; }

        public int? OrderId { get; set; }

        [Required]
        [StringLength(150)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(160)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        [StringLength(50)]
        public string Priority { get; set; } = "Normal";
    }

    public class UpdateSupportTicketDto
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Open";

        [Required]
        [StringLength(50)]
        public string Priority { get; set; } = "Normal";
    }
}
