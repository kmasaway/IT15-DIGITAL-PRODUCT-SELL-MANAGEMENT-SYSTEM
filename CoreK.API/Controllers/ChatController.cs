using CoreK.API.Data;
using CoreK.API.DTOs;
using CoreK.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreK.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Seller,Customer")]
    public class ChatController : CoreKControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("threads")]
        public async Task<IActionResult> GetThreads()
        {
            try
            {
                if (IsSeller)
                {
                    var orderRows = await _context.Orders
                        .Include(o => o.Product)
                        .Where(o => o.Product != null && o.Product.SellerId == CurrentUserId)
                        .Select(o => new
                        {
                            o.CustomerId,
                            o.CustomerName,
                            o.ProductId,
                            ProductTitle = o.Product == null ? "Digital Product" : o.Product.Title,
                            o.CreatedAt
                        })
                        .ToListAsync();

                    var customerIds = orderRows.Select(o => o.CustomerId).Distinct().ToList();
                    var messages = await _context.ChatMessages
                        .Where(m => m.SellerId == CurrentUserId && customerIds.Contains(m.CustomerId))
                        .OrderByDescending(m => m.CreatedAt)
                        .ToListAsync();

                    var threads = orderRows
                        .GroupBy(o => o.CustomerId)
                        .Select(group =>
                        {
                            var latestOrder = group.OrderByDescending(o => o.CreatedAt).First();
                            var latestMessage = messages.FirstOrDefault(m => m.CustomerId == group.Key);

                            return new
                            {
                                ThreadId = $"{CurrentUserId}:{group.Key}",
                                SellerId = CurrentUserId,
                                CustomerId = group.Key,
                                DisplayName = latestOrder.CustomerName,
                                ProductId = latestOrder.ProductId,
                                ProductTitle = latestOrder.ProductTitle,
                                LastMessage = latestMessage?.Message,
                                LastMessageAt = latestMessage?.CreatedAt ?? latestOrder.CreatedAt
                            };
                        })
                        .OrderByDescending(thread => thread.LastMessageAt)
                        .ToList();

                    return Ok(threads);
                }

                var customerOrders = await _context.Orders
                    .Include(o => o.Product)
                    .Where(o => o.CustomerId == CurrentUserId && o.Product != null)
                    .Select(o => new
                    {
                        SellerId = o.Product == null ? 0 : o.Product.SellerId,
                        o.CustomerId,
                        o.CustomerName,
                        o.ProductId,
                        ProductTitle = o.Product == null ? "Digital Product" : o.Product.Title,
                        o.CreatedAt
                    })
                    .ToListAsync();

                var sellerIds = customerOrders.Select(o => o.SellerId).Where(id => id > 0).Distinct().ToList();
                var sellerNames = await _context.Users
                    .Where(u => sellerIds.Contains(u.UserId))
                    .ToDictionaryAsync(u => u.UserId, u => u.FullName);
                var customerMessages = await _context.ChatMessages
                    .Where(m => m.CustomerId == CurrentUserId && sellerIds.Contains(m.SellerId))
                    .OrderByDescending(m => m.CreatedAt)
                    .ToListAsync();

                var customerThreads = customerOrders
                    .Where(o => o.SellerId > 0)
                    .GroupBy(o => o.SellerId)
                    .Select(group =>
                    {
                        var latestOrder = group.OrderByDescending(o => o.CreatedAt).First();
                        var latestMessage = customerMessages.FirstOrDefault(m => m.SellerId == group.Key);
                        var sellerName = sellerNames.TryGetValue(group.Key, out var name) ? name : "CoreK Seller";

                        return new
                        {
                            ThreadId = $"{group.Key}:{CurrentUserId}",
                            SellerId = group.Key,
                            CustomerId = CurrentUserId,
                            DisplayName = sellerName,
                            ProductId = latestOrder.ProductId,
                            ProductTitle = latestOrder.ProductTitle,
                            LastMessage = latestMessage?.Message,
                            LastMessageAt = latestMessage?.CreatedAt ?? latestOrder.CreatedAt
                        };
                    })
                    .OrderByDescending(thread => thread.LastMessageAt)
                    .ToList();

                return Ok(customerThreads);
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return Ok(Array.Empty<object>());
            }
        }

        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] int sellerId, [FromQuery] int customerId)
        {
            var resolvedSellerId = IsSeller ? CurrentUserId : sellerId;
            var resolvedCustomerId = IsCustomer ? CurrentUserId : customerId;

            if (resolvedSellerId <= 0 || resolvedCustomerId <= 0)
            {
                return BadRequest("Seller and customer are required.");
            }

            try
            {
                if (!await CanAccessThread(resolvedSellerId, resolvedCustomerId))
                {
                    return Forbid();
                }

                var messages = await _context.ChatMessages
                    .Where(m => m.SellerId == resolvedSellerId && m.CustomerId == resolvedCustomerId)
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new
                    {
                        Id = m.ChatMessageId,
                        m.SellerId,
                        m.CustomerId,
                        m.ProductId,
                        SenderId = m.SenderId,
                        Sender = m.SenderName,
                        m.SenderRole,
                        Text = m.Message,
                        m.CreatedAt
                    })
                    .ToListAsync();

                return Ok(messages);
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return Ok(Array.Empty<object>());
            }
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] CreateChatMessageDto dto)
        {
            var message = dto.Message?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(message))
            {
                return BadRequest("Message is required.");
            }

            var sellerId = IsSeller ? CurrentUserId : dto.SellerId.GetValueOrDefault();
            var customerId = IsCustomer ? CurrentUserId : dto.CustomerId.GetValueOrDefault();

            if (sellerId <= 0 || customerId <= 0)
            {
                return BadRequest("Seller and customer are required.");
            }

            try
            {
                if (!await CanAccessThread(sellerId, customerId, dto.ProductId))
                {
                    return Forbid();
                }

                var sender = await _context.Users.FindAsync(CurrentUserId);
                var chatMessage = new ChatMessage
                {
                    SellerId = sellerId,
                    CustomerId = customerId,
                    ProductId = dto.ProductId,
                    SenderId = CurrentUserId,
                    SenderName = sender?.FullName ?? "CoreK User",
                    SenderRole = IsSeller ? "Seller" : "Customer",
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ChatMessages.Add(chatMessage);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Id = chatMessage.ChatMessageId,
                    chatMessage.SellerId,
                    chatMessage.CustomerId,
                    chatMessage.ProductId,
                    SenderId = chatMessage.SenderId,
                    Sender = chatMessage.SenderName,
                    chatMessage.SenderRole,
                    Text = chatMessage.Message,
                    chatMessage.CreatedAt
                });
            }
            catch (Exception ex) when (DatabaseErrorHelper.IsMissingStorage(ex))
            {
                return StatusCode(503, new { message = "Messenger storage is still being prepared. Please try again shortly." });
            }
        }

        private async Task<bool> CanAccessThread(int sellerId, int customerId, int? productId = null)
        {
            var hasOrder = _context.Orders
                .Include(o => o.Product)
                .Where(o => o.CustomerId == customerId && o.Product != null && o.Product.SellerId == sellerId);

            if (productId.HasValue)
            {
                hasOrder = hasOrder.Where(o => o.ProductId == productId.Value);
            }

            if (await hasOrder.AnyAsync())
            {
                return true;
            }

            return await _context.ChatMessages
                .AnyAsync(m => m.SellerId == sellerId && m.CustomerId == customerId);
        }
    }
}
