using System.ComponentModel.DataAnnotations;

namespace CoreK.API.Models
{
    public class Category
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Description { get; set; }

        public bool IsArchived { get; set; } = false;
    }
}
