from django.contrib import admin
from .models import CatalogFilter, Conversation, User, Portfolio, PorfolioImage, Product, ProductImage, ProductReview

admin.site.register(User)
admin.site.register(Portfolio)
admin.site.register(PorfolioImage)
admin.site.register(CatalogFilter)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(ProductReview)
admin.site.register(Conversation)