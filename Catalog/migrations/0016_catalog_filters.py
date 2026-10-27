from django.db import migrations, models


OPTIONS = [
    ('category', ['Скульптура', 'Живопись', 'Декор', 'Мебель', 'Текстиль']),
    ('color', ['Натуральный дуб', 'Молочный', 'Белый камень', 'Графит и молоко', 'Графит']),
    ('texture', ['Древесная', 'Тканая', 'Каменная', 'Матовая', 'Гладкая']),
    ('material', ['Массив дуба', 'Дерево', 'Ткань', 'Камень', 'Бумага', 'Металл']),
    ('style', ['Минимализм', 'Современный']),
    ('format', ['Настенный', 'Напольный']),
    ('subject', ['Интерьер', 'Абстракция']),
]

LINKS = {
    'Подвесной шкаф из дуба': [
        ('category', 'Мебель'),
        ('color', 'Натуральный дуб'),
        ('texture', 'Древесная'),
        ('material', 'Массив дуба'),
        ('style', 'Минимализм'),
        ('format', 'Настенный'),
        ('subject', 'Интерьер'),
    ],
    'Кресло с высокой спинкой': [
        ('category', 'Мебель'),
        ('color', 'Молочный'),
        ('texture', 'Тканая'),
        ('material', 'Дерево'),
        ('material', 'Ткань'),
        ('style', 'Современный'),
        ('format', 'Напольный'),
        ('subject', 'Интерьер'),
    ],
    'Кухонный остров': [
        ('category', 'Мебель'),
        ('color', 'Белый камень'),
        ('texture', 'Каменная'),
        ('material', 'Дерево'),
        ('material', 'Камень'),
        ('style', 'Минимализм'),
        ('format', 'Напольный'),
        ('subject', 'Интерьер'),
    ],
    'Композиция для стены': [
        ('category', 'Живопись'),
        ('color', 'Графит и молоко'),
        ('texture', 'Матовая'),
        ('material', 'Бумага'),
        ('material', 'Дерево'),
        ('style', 'Современный'),
        ('format', 'Настенный'),
        ('subject', 'Абстракция'),
    ],
    'Напольный светильник': [
        ('category', 'Декор'),
        ('color', 'Графит'),
        ('texture', 'Гладкая'),
        ('material', 'Металл'),
        ('style', 'Минимализм'),
        ('format', 'Напольный'),
        ('subject', 'Интерьер'),
    ],
}

SPHERE_CATEGORY = {
    'sculpture': 'Скульптура',
    'fine_art': 'Живопись',
    'wall_painting': 'Живопись',
    'calligraphy': 'Живопись',
    'decoration': 'Декор',
    'ceramics': 'Декор',
    'mosaic': 'Декор',
    'stained_glass': 'Декор',
    'lighting': 'Декор',
    'floristics': 'Декор',
    'jewelry': 'Декор',
    'object_design': 'Декор',
    'furniture_design': 'Мебель',
    'woodworking': 'Мебель',
    'textile': 'Текстиль',
}


def seed_filters(apps, schema_editor):
    CatalogFilter = apps.get_model('Catalog', 'CatalogFilter')
    Product = apps.get_model('Catalog', 'Product')
    ProductType = apps.get_model('Catalog', 'ProductType')
    stored = {}
    for kind, names in OPTIONS:
        for position, name in enumerate(names):
            row, _created = CatalogFilter.objects.get_or_create(
                kind=kind,
                name=name,
                defaults={'position': position},
            )
            stored[(kind, name)] = row

    def attach(product, kind, name):
        row = stored.get((kind, name))
        if row is None:
            row, _created = CatalogFilter.objects.get_or_create(
                kind=kind,
                name=name,
                defaults={'position': 100},
            )
            stored[(kind, name)] = row
        product.filters.add(row)

    for product in Product.objects.all():
        for kind, name in LINKS.get(product.title, []):
            attach(product, kind, name)
        if not product.filters.filter(kind='category').exists() and product.product_type_id:
            product_type = ProductType.objects.filter(pk=product.product_type_id).first()
            category = SPHERE_CATEGORY.get(product_type.sphere if product_type else '')
            if category:
                attach(product, 'category', category)
        color = (product.color or '').strip()
        if color and not product.filters.filter(kind='color').exists():
            attach(product, 'color', color)
        if not product.filters.filter(kind='material').exists():
            for part in (product.materials or '').split(','):
                name = part.strip()
                if name:
                    attach(product, 'material', name[:1].upper() + name[1:])


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0015_admin_log_user_fk'),
    ]

    operations = [
        migrations.CreateModel(
            name='CatalogFilter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('category', 'Категория'), ('color', 'Цвет'), ('texture', 'Текстура'), ('material', 'Материал'), ('style', 'Стиль'), ('format', 'Формат'), ('subject', 'Сюжет')], max_length=20, verbose_name='Группа')),
                ('name', models.CharField(max_length=100, verbose_name='Значение')),
                ('position', models.PositiveSmallIntegerField(default=0, verbose_name='Порядок')),
            ],
            options={
                'verbose_name': 'Фильтр каталога',
                'verbose_name_plural': 'Фильтры каталога',
                'ordering': ['kind', 'position', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='catalogfilter',
            constraint=models.UniqueConstraint(fields=('kind', 'name'), name='unique_catalog_filter'),
        ),
        migrations.AddField(
            model_name='product',
            name='filters',
            field=models.ManyToManyField(blank=True, related_name='products', to='Catalog.catalogfilter', verbose_name='Фильтры'),
        ),
        migrations.RunPython(seed_filters, migrations.RunPython.noop),
    ]
