using System.ComponentModel.DataAnnotations;

namespace CoreK.API.DTOs
{
    public class CreateChatMessageDto
    {
        public int? SellerId { get; set; }

        public int? CustomerId { get; set; }

        public int? ProductId { get; set; }

        [Required]
        public string Message { get; set; } = string.Empty;
    }
}
