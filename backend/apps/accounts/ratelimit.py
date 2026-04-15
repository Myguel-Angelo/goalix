# from django_ratelimit.core import is_ratelimited
# from django_ratelimit.decorators import ratelimit
# from django.utils.decorators import method_decorator
# from django_ratelimit.exceptions import Ratelimited
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status


# class RateLimitedAPIView(APIView):
#     """
#     Base APIView with rate limiting capabilities
#     """

#     # Override these in subclasses
#     rate_limit_key = None  # Function or string for rate limit key
#     rate_limit_rate = '5/h'  # Default: 5 requests per hour
#     rate_limit_method = ['POST']  # Methods to limit
#     rate_limit_block = True  # Whether to block or just log

#     def dispatch(self, request, *args, **kwargs):
#         # Apply rate limiting if configured
#         if self.rate_limit_key and self.rate_limit_rate:
#             try:
#                 # Check if rate limited
#                 limited = is_ratelimited(
#                     request=request,
#                     fn=self.dispatch,
#                     key=self.rate_limit_key,
#                     rate=self.rate_limit_rate,
#                     method=self.rate_limit_method,
#                     increment=True
#                 )

#                 if limited and self.rate_limit_block:
#                     return Response(
#                         {"detail": "Muitas tentativas. Por favor, tente novamente mais tarde."},
#                         status=status.HTTP_429_TOO_MANY_REQUESTS
#                     )
#             except Exception:
#                 # If rate limiting fails, continue without blocking (fail open)
#                 pass

#         return super().dispatch(request, *args, **kwargs)


# def email_or_ip_key(group):
#     """
#     Rate limit key function: use email if provided, otherwise IP address
#     """
#     def key_func(request):
#         # Try to get email from request data
#         email = None
#         if hasattr(request, 'data') and isinstance(request.data, dict):
#             email = request.data.get('email', '').lower().strip()
#         elif hasattr(request, 'GET') and isinstance(request.GET, dict):
#             email = request.GET.get('email', '').lower().strip()

#         if email:
#             return f"email:{email}"
#         else:
#             # Fallback to IP address
#             x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#             if x_forwarded_for:
#                 ip = x_forwarded_for.split(',')[0]
#             else:
#                 ip = request.META.get('REMOTE_ADDR')
#             return f"ip:{ip}"

#     return key_func


# def ip_key(group):
#     """
#     Rate limit key function: use IP address only
#     """
#     def key_func(request):
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0]
#         else:
#             ip = request.META.get('REMOTE_ADDR')
#         return f"ip:{ip}"

#     return key_func