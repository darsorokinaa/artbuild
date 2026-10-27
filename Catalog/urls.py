from django.urls import path
from . import views

urlpatterns = [
    path('catalog/', views.catalog, name='catalog'),
    path('filters/', views.catalog_filters, name='catalog-filters'),
    path('masters/', views.masters, name='masters'),
    path('masters/<int:user_id>/', views.master_detail, name='master-detail'),
    path('conversations/', views.open_conversation, name='open-conversation'),
    path('conversations', views.open_conversation),
    path('conversations/<int:conversation_id>/', views.conversation_detail, name='conversation-detail'),
    path('conversations/<int:conversation_id>', views.conversation_detail),
    path('register/', views.register, name='register'),
    path('register', views.register),
    path('login/', views.login, name='login'),
    path('login', views.login),
    path('account/', views.account_home, name='account'),
    path('account', views.account_home),
]