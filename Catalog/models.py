import inspect

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


def review_rating_constraint():
    check = models.Q(rating__gte=1, rating__lte=5)
    if 'condition' in inspect.signature(models.CheckConstraint).parameters:
        return models.CheckConstraint(condition=check, name='review_rating_range')
    return models.CheckConstraint(check=check, name='review_rating_range')


# =========================
# ПОЛЬЗОВАТЕЛИ
# =========================

class User(AbstractUser):

    class Role(models.TextChoices):
        MASTER = 'master', 'Мастер'
        DESIGNER = 'designer', 'Дизайнер'
        ARCHITECT = 'architect', 'Архитектор'
        CUSTOMER = 'customer', 'Заказчик'

    email = models.EmailField(
        unique=True,
        verbose_name='Электронная почта'
    )

    phone = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Телефон'
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name='Аватар'
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        verbose_name='Роль пользователя'
    )

    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Краткое резюме'
    )

    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата подтверждения email'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата регистрации'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.username


# =========================
# ПОРТФОЛИО
# =========================

class Portfolio(models.Model):

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        MODERATION = 'moderation', 'На модерации'
        PUBLISHED = 'published', 'Опубликовано'
        REJECTED = 'rejected', 'Отклонено'

    portfolio_owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='portfolios',
        verbose_name='Владелец портфолио'
    )

    portfolio_title = models.CharField(
        max_length=300,
        verbose_name='Название работы'
    )

    portfolio_description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание работы'
    )

    duration = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Срок выполнения'
    )

    portfolio_work_durations = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Продолжительность работы'
    )

    main = models.BooleanField(
        default=False,
        verbose_name='Основная работа (для каталога)'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Статус публикации'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата публикации'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Работа портфолио'
        verbose_name_plural = 'Работы портфолио'
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.id} - {self.portfolio_title}'


# =========================
# ИЗОБРАЖЕНИЯ ПОРТФОЛИО
# =========================

class PorfolioImage(models.Model):

    portfolio_id = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Работа портфолио'
    )

    image = models.ImageField(
        upload_to='portfolio/',
        null=True,
        blank=True,
        verbose_name='Изображение'
    )

    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание изображения'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )

    class Meta:
        verbose_name = 'Изображение портфолио'
        verbose_name_plural = 'Изображения портфолио'

    def __str__(self):
        return f'Изображение для {self.portfolio_id.portfolio_title}'


# =========================
# ТИПЫ ДЕЯТЕЛЬНОСТИ
# =========================

class ProductType(models.Model):

    class Sphere(models.TextChoices):

        INTERIOR_DESIGN = 'interior_design', 'Дизайн интерьера'
        ARCHITECTURE = 'architecture', 'Архитектура'
        LANDSCAPE_DESIGN = 'landscape_design', 'Ландшафтный дизайн'
        OBJECT_DESIGN = 'object_design', 'Предметный дизайн'
        FURNITURE_DESIGN = 'furniture_design', 'Дизайн и производство мебели'

        FINE_ART = 'fine_art', 'Изобразительное искусство'
        SCULPTURE = 'sculpture', 'Скульптура'
        CERAMICS = 'ceramics', 'Керамика'
        MOSAIC = 'mosaic', 'Мозаика'
        STAINED_GLASS = 'stained_glass', 'Витражи'
        WALL_PAINTING = 'wall_painting', 'Роспись стен'
        CALLIGRAPHY = 'calligraphy', 'Каллиграфия'
        JEWELRY = 'jewelry', 'Ювелирное искусство'

        DECORATION = 'decoration', 'Декорирование'
        TEXTILE = 'textile', 'Текстиль'
        LIGHTING = 'lighting', 'Освещение и светодизайн'
        FLORISTICS = 'floristics', 'Флористика'

        CONSTRUCTION = 'construction', 'Строительство'
        FINISHING = 'finishing', 'Отделочные работы'
        RESTORATION = 'restoration', 'Реставрация'
        DECORATIVE_PLASTER = 'decorative_plaster', 'Декоративная штукатурка'
        INSTALLATION = 'installation', 'Монтажные работы'

        WOODWORKING = 'woodworking', 'Работа с деревом'
        METALWORKING = 'metalworking', 'Работа с металлом'
        STONEWORKING = 'stoneworking', 'Работа с камнем'
        GLASSWORKING = 'glassworking', 'Работа со стеклом'
        BLACKSMITHING = 'blacksmithing', 'Кузнечное дело'

        CUSTOM_MANUFACTURING = 'custom_manufacturing', 'Производство на заказ'
        EVENT_DESIGN = 'event_design', 'Оформление мероприятий'
        SCENOGRAPHY = 'scenography', 'Сценография'
        OTHER = 'other', 'Другое'

    sphere = models.CharField(
        max_length=50,
        choices=Sphere.choices,
        default=Sphere.OTHER,
        verbose_name='Сфера деятельности'
    )

    class Meta:
        verbose_name = 'Тип деятельности'
        verbose_name_plural = 'Типы деятельности'

    def __str__(self):
        return self.get_sphere_display()


# =========================
# ТОВАРЫ
# =========================

class Product(models.Model):

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        MODERATION = 'moderation', 'На модерации'
        PUBLISHED = 'published', 'Опубликован'
        REJECTED = 'rejected', 'Отклонён'
        ARCHIVED = 'archived', 'В архиве'

    # Продавец
    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='products',
        null=True,
        blank=True,
        verbose_name='Продавец'
    )

    # Тип товара
    product_type = models.ForeignKey(
        ProductType,
        on_delete=models.PROTECT,
        related_name='products',
        null=True,
        blank=True,
        verbose_name='Тип товара'
    )

    # Название
    title = models.CharField(
        max_length=300,
        default='',
        verbose_name='Название товара'
    )

    # Описание
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание товара'
    )

    # Цена
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Цена, ₽'
    )

    # Количество
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество в наличии'
    )

    # Материалы
    materials = models.CharField(
        max_length=300,
        blank=True,
        verbose_name='Материалы'
    )

    # Размеры
    dimensions = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Размеры'
    )

    # Вес
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Вес, кг'
    )

    # Цвет
    color = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Цвет'
    )

    # Изготовление на заказ
    made_to_order = models.BooleanField(
        default=False,
        verbose_name='Изготавливается на заказ'
    )

    # Срок изготовления
    production_time = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Срок изготовления'
    )

    # Статус товара
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='Статус публикации'
    )

    # Дата создания
    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
        verbose_name='Дата создания'
    )

    # Дата обновления
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']

    def __str__(self):
        return self.title or f'Товар №{self.pk}'


# =========================
# ФОТОГРАФИИ ТОВАРОВ
# =========================

class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Товар'
    )

    image = models.ImageField(
        upload_to='products/',
        verbose_name='Фотография'
    )

    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание фотографии'
    )

    is_main = models.BooleanField(
        default=False,
        verbose_name='Главная фотография'
    )

    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name='Порядок отображения'
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False,
        verbose_name='Дата загрузки'
    )

    class Meta:
        verbose_name = 'Фотография товара'
        verbose_name_plural = 'Фотографии товаров'
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'Фото товара: {self.product.title}'


class ProductReview(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Товар'
    )

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='product_reviews',
        verbose_name='Автор'
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оценка'
    )

    text = models.TextField(
        verbose_name='Текст'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата'
    )

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'author'],
                name='unique_product_review',
            ),
            review_rating_constraint(),
        ]

    def __str__(self):
        return f'{self.rating} — {self.product}'


class Conversation(models.Model):

    user_one = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dialogs_as_one',
        verbose_name='Участник 1'
    )

    user_two = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dialogs_as_two',
        verbose_name='Участник 2'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата начала'
    )

    messages = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Сообщения'
    )

    class Meta:
        verbose_name = 'Диалог'
        verbose_name_plural = 'Диалоги'
        constraints = [
            models.UniqueConstraint(
                fields=['user_one', 'user_two'],
                name='unique_user_pair',
            )
        ]

    def __str__(self):
        return f'Диалог {self.user_one_id} и {self.user_two_id}'


