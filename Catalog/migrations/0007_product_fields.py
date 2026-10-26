import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Catalog", "0006_product_producttype_portfolio_main_portfolio_status_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.DeleteModel(name="Product"),
        migrations.CreateModel(
            name="Product",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "seller",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="products",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Продавец",
                    ),
                ),
                (
                    "product_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="products",
                        to="Catalog.producttype",
                        verbose_name="Тип товара",
                    ),
                ),
                ("title", models.CharField(max_length=300, verbose_name="Название товара")),
                ("description", models.TextField(verbose_name="Описание товара")),
                (
                    "price",
                    models.DecimalField(decimal_places=2, max_digits=12, verbose_name="Цена, ₽"),
                ),
                (
                    "quantity",
                    models.PositiveIntegerField(default=1, verbose_name="Количество в наличии"),
                ),
                (
                    "materials",
                    models.CharField(blank=True, max_length=300, verbose_name="Материалы"),
                ),
                (
                    "dimensions",
                    models.CharField(blank=True, max_length=200, verbose_name="Размеры"),
                ),
                (
                    "weight",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        max_digits=10,
                        null=True,
                        verbose_name="Вес, кг",
                    ),
                ),
                ("color", models.CharField(blank=True, max_length=100, verbose_name="Цвет")),
                (
                    "made_to_order",
                    models.BooleanField(default=False, verbose_name="Изготавливается на заказ"),
                ),
                (
                    "production_time",
                    models.CharField(blank=True, max_length=100, verbose_name="Срок изготовления"),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Черновик"),
                            ("moderation", "На модерации"),
                            ("published", "Опубликован"),
                            ("rejected", "Отклонён"),
                            ("archived", "В архиве"),
                        ],
                        default="draft",
                        max_length=20,
                        verbose_name="Статус публикации",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Дата создания"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Дата обновления"),
                ),
            ],
            options={
                "verbose_name": "Товар",
                "verbose_name_plural": "Товары",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProductImage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "image",
                    models.ImageField(upload_to="products/", verbose_name="Фотография"),
                ),
                (
                    "description",
                    models.CharField(
                        blank=True,
                        max_length=300,
                        verbose_name="Описание фотографии",
                    ),
                ),
                (
                    "is_main",
                    models.BooleanField(default=False, verbose_name="Главная фотография"),
                ),
                (
                    "sort_order",
                    models.PositiveIntegerField(default=0, verbose_name="Порядок отображения"),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки"),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="Catalog.product",
                        verbose_name="Товар",
                    ),
                ),
            ],
            options={
                "verbose_name": "Фотография товара",
                "verbose_name_plural": "Фотографии товаров",
                "ordering": ["sort_order", "id"],
            },
        ),
    ]
