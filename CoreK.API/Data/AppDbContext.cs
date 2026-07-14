using Microsoft.EntityFrameworkCore;
using CoreK.API.Models;

namespace CoreK.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductVersion> ProductVersions { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<PayoutRequest> PayoutRequests { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<ValidIdSubmission> ValidIdSubmissions { get; set; }
        public DbSet<SellerSubscription> SellerSubscriptions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.Product)
                .WithMany()
                .HasForeignKey(o => o.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PayoutRequest>()
                .HasOne(p => p.Seller)
                .WithMany()
                .HasForeignKey(p => p.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SupportTicket>()
                .HasOne(t => t.Product)
                .WithMany()
                .HasForeignKey(t => t.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<SupportTicket>()
                .HasOne(t => t.Order)
                .WithMany()
                .HasForeignKey(t => t.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Product)
                .WithMany()
                .HasForeignKey(m => m.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ChatMessage>()
                .HasIndex(m => new { m.SellerId, m.CustomerId, m.CreatedAt });

            modelBuilder.Entity<ValidIdSubmission>()
                .HasOne(v => v.User)
                .WithMany()
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ValidIdSubmission>()
                .HasIndex(v => v.UserId)
                .IsUnique();

            modelBuilder.Entity<SellerSubscription>()
                .HasOne(s => s.Seller)
                .WithMany()
                .HasForeignKey(s => s.SellerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SellerSubscription>()
                .HasIndex(s => s.SellerId)
                .IsUnique();
        }
    }
}
