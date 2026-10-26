from django.contrib import admin
from .models import User, Portfolio, PorfolioImage, Product, ProductImage

admin.site.register(User)
admin.site.register(Portfolio)
admin.site.register(PorfolioImage)
admin.site.register(Product)
admin.site.register(ProductImage)