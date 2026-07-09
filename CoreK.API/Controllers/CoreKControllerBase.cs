using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace CoreK.API.Controllers
{
    public abstract class CoreKControllerBase : ControllerBase
    {
        protected int CurrentUserId
        {
            get
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return int.TryParse(userId, out var parsedUserId) ? parsedUserId : 0;
            }
        }

        protected bool IsAdmin => User.IsInRole("Admin");

        protected bool IsSeller => User.IsInRole("Seller");

        protected bool IsCustomer => User.IsInRole("Customer");

        protected bool IsSelfOrAdmin(int userId) => IsAdmin || CurrentUserId == userId;
    }
}
