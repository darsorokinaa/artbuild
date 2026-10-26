from django.urls import path
from . import views

urlpatterns = [
    path('catalog/', views.catalog, name='catalog'),
    path('masters/', views.masters, name='masters'),
    path('masters/<int:user_id>/', views.master_detail, name='master-detail'),
    path('conversations/', views.open_conversation, name='open-conversation'),
    path('conversations/<int:conversation_id>/', views.conversation_detail, name='conversation-detail'),
]