using System;

namespace CoreK.API.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        // This will store the secure Bcrypt password hash
        public string PasswordHash { get; set; } = string.Empty;
        
        // Role property to support Role-Based Access Control (RBAC)
        public string Role { get; set; } = "Customer"; // Default role: Customer, Admin, Seller
        
        // --- ADDED FOR GMAIL/EMAIL VERIFICATION PIPELINE ---
        public bool IsEmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }
        // ---------------------------------------------------

        // For your proposed 2FA feature
        public string? TwoFactorSecret { get; set; }
        public bool IsTwoFactorEnabled { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}