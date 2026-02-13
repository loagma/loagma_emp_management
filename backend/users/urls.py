"""
URL configuration for users app - Authentication endpoints only.
"""
from django.urls import path
from .views import current_user

urlpatterns = [
    path('me/', current_user, name='current-user'),
]
