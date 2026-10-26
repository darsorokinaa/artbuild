from django.db import migrations, models


REVIEWS = [
    (1, 4, 5, 'Шкаф встал в нишу точно по размерам. Дуб спокойный, полки держат книги.'),
    (1, 5, 4, 'Собрали аккуратно. Ждали дольше обещанных восьми недель, но дерево хорошее.'),
    (2, 6, 5, 'Кресло удобное, обивка не маркая. Ножки ровные.'),
    (2, 4, 4, 'Сидеть хорошо, спинка высокая. Хотелось бы более плотную ткань.'),
    (3, 5, 5, 'Остров стал центром кухни. Камень ровный, дерево тёплое.'),
    (3, 6, 5, 'Размеры совпали с чертежом. Столешницу привезли без сколов.'),
    (4, 4, 5, 'Листы легли на стену ровно, рамы тонкие и не спорят со светом.'),
    (4, 10, 4, 'Композиция спокойная. Для столовой заказал бы чуть крупнее.'),
    (5, 6, 4, 'Свет мягкий, стойка устойчивая. Плафон чуть ярче, чем на фото.'),
    (5, 5, 5, 'Светильник лёгкий и собран чисто. В гостиной смотрится точно.'),
]


def seed_reviews(apps, schema_editor):
    ProductReview = apps.get_model('Catalog', 'ProductReview')
    User = apps.get_model('Catalog', 'User')
    Product = apps.get_model('Catalog', 'Product')
    for product_id, author_id, rating, text in REVIEWS:
        if not User.objects.filter(pk=author_id).exists() or not Product.objects.filter(pk=product_id).exists():
            continue
        if ProductReview.objects.filter(product_id=product_id, author_id=author_id).exists():
            continue
        ProductReview.objects.create(
            product_id=product_id,
            author_id=author_id,
            rating=rating,
            text=text,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0013_messages_inside_dialog'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(verbose_name='Оценка')),
                ('text', models.TextField(verbose_name='Текст')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата')),
                ('author', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='product_reviews', to='Catalog.user', verbose_name='Автор')),
                ('product', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='reviews', to='Catalog.product', verbose_name='Товар')),
            ],
            options={
                'verbose_name': 'Отзыв',
                'verbose_name_plural': 'Отзывы',
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='productreview',
            constraint=models.UniqueConstraint(fields=('product', 'author'), name='unique_product_review'),
        ),
        migrations.AddConstraint(
            model_name='productreview',
            constraint=models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name='review_rating_range'),
        ),
        migrations.RunPython(seed_reviews, migrations.RunPython.noop),
    ]
