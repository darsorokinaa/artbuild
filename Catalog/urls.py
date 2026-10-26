from django.urls import path
from . import views

urlpatterns = [
    path('catalog/', views.catalog, name='catalog'),
    path('masters/', views.masters, name='masters'),
    path('masters/<int:user_id>/', views.master_detail, name='master-detail'),
]