using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreK.API.Models
{
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        public int SellerId { get; set; } // Points to User.UserId (The creator)

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; } = 100;

        public bool IsActive { get; set; } = true;

        [Required]
        [StringLength(50)]
        public string ApprovalStatus { get; set; } = "Approved";

        [StringLength(500)]
        public string? ReviewRemarks { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }
        
        public List<ProductVersion> Versions { get; set; } = new();
    }

    public class ProductVersion
    {
        [Key]
        public int VersionId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(20)]
        public string VersionNumber { get; set; } = "1.0.0"; // e.g., v1.1, v2.0

        public string? Changelog { get; set; }

        [Required]
        public string SecureFilePath { get; set; } = string.Empty; // Path or Cloud Storage URL

        public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }
    }
}
