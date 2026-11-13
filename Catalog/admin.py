from django.contrib import admin
from .models import (
    CatalogFilter,
    Conversation,
    MakerProfile,
    Notice,
    PorfolioImage,
    Portfolio,
    Product,
    ProductImage,
    ProductReview,
    Task,
    TaskImage,
    TaskResponse,
    TaskResponseImage,
    User,
)

admin.site.register(User)
admin.site.register(Portfolio)
admin.site.register(PorfolioImage)
admin.site.register(CatalogFilter)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(ProductReview)
admin.site.register(Conversation)
admin.site.register(MakerProfile)
admin.site.register(Task)
admin.site.register(TaskImage)
admin.site.register(TaskResponse)
admin.site.register(TaskResponseImage)
admin.site.register(Notice)