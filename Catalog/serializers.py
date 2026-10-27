from rest_framework import serializers
from .models import Portfolio, Product, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'avatar',
        ]


class ProductSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(read_only=True, allow_null=True)
    seller_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    sphere = serializers.CharField(source='product_type.get_sphere_display', read_only=True)
    filters = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'title',
            'description',
            'price',
            'quantity',
            'seller_id',
            'seller_name',
            'avatar',
            'image',
            'images',
            'sphere',
            'color',
            'materials',
            'dimensions',
            'weight',
            'made_to_order',
            'filters',
            'production_time',
            'reviews',
            'rating',
        ]

    def get_filters(self, product):
        grouped = {
            'category': '',
            'color': '',
            'texture': '',
            'material': [],
            'style': '',
            'format': '',
            'subject': '',
        }
        for item in product.filters.all():
            if item.kind == 'material':
                grouped['material'].append(item.name)
            elif item.kind in grouped and not grouped[item.kind]:
                grouped[item.kind] = item.name
        grouped['material'].sort()
        return grouped

    def get_reviews(self, product):
        return [
            {
                'id': review.id,
                'author': f'{review.author.first_name} {review.author.last_name}'.strip(),
                'rating': review.rating,
                'text': review.text,
            }
            for review in product.reviews.all()
        ]

    def get_rating(self, product):
        scores = [review.rating for review in product.reviews.all()]
        if not scores:
            return None
        return round(sum(scores) / len(scores), 1)

    def get_seller_name(self, product):
        return f'{product.seller.first_name} {product.seller.last_name}'.strip()

    def get_avatar(self, product):
        if not product.seller.avatar:
            return None
        request = self.context.get('request')
        url = product.seller.avatar.url
        if request is None:
            return url
        return request.build_absolute_uri(url)

    def product_photos(self, product):
        photos = [photo for photo in product.images.all() if photo.image]
        photos.sort(key=lambda photo: (not photo.is_main, photo.sort_order, photo.id))
        return photos

    def photo_url(self, photo):
        request = self.context.get('request')
        url = photo.image.url
        if request is None:
            return url
        return request.build_absolute_uri(url)

    def get_image(self, product):
        photos = self.product_photos(product)
        if not photos:
            return None
        return self.photo_url(photos[0])

    def get_images(self, product):
        return [self.photo_url(photo) for photo in self.product_photos(product)]


class PortfolioSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='portfolio_title')
    owner_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    role = serializers.CharField(source='portfolio_owner.role')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id',
            'title',
            'owner_name',
            'avatar',
            'role',
            'image',
            'duration',
        ]

    def get_owner_name(self, work):
        owner = work.portfolio_owner
        return f'{owner.first_name} {owner.last_name}'.strip()

    def get_avatar(self, work):
        owner = work.portfolio_owner
        if not owner.avatar:
            return None
        request = self.context.get('request')
        url = owner.avatar.url
        if request is None:
            return url
        return request.build_absolute_uri(url)

    def get_image(self, work):
        photo = next((item for item in work.images.all() if item.image), None)
        if photo is None:
            return None
        request = self.context.get('request')
        url = photo.image.url
        if request is None:
            return url
        return request.build_absolute_uri(url)

        