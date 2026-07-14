using Microsoft.Data.SqlClient;

namespace CoreK.API.Controllers
{
    internal static class DatabaseErrorHelper
    {
        public static bool IsMissingStorage(Exception exception)
        {
            var currentException = exception;

            while (currentException != null)
            {
                if (currentException is SqlException sqlException
                    && sqlException.Errors.Cast<SqlError>().Any(error => error.Number is 207 or 208))
                {
                    return true;
                }

                currentException = currentException.InnerException;
            }

            return false;
        }
    }
}
