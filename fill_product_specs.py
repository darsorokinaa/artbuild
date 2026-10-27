import os
from decimal import Decimal

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "artbuild.settings")
django.setup()

from django.db import transaction

from Catalog.models import CatalogFilter, Product

SPECS = {
    "Подвесной шкаф из дуба": {
        "color": "Натуральный дуб",
        "materials": "Массив дуба",
        "dimensions": "180 × 40 × 90 см",
        "weight": Decimal("32"),
        "production_time": "8 недель",
        "made_to_order": True,
        "filters": [
            ("category", "Мебель"),
            ("color", "Натуральный дуб"),
            ("texture", "Древесная"),
            ("material", "Массив дуба"),
            ("style", "Минимализм"),
            ("format", "Настенный"),
            ("subject", "Интерьер"),
        ],
    },
    "Кресло с высокой спинкой": {
        "color": "Молочный",
        "materials": "Дерево, ткань",
        "dimensions": "72 × 70 × 80 см",
        "weight": Decimal("14"),
        "production_time": "6 недель",
        "made_to_order": False,
        "filters": [
            ("category", "Мебель"),
            ("color", "Молочный"),
            ("texture", "Тканая"),
            ("material", "Дерево"),
            ("material", "Ткань"),
            ("style", "Современный"),
            ("format", "Напольный"),
            ("subject", "Интерьер"),
        ],
    },
    "Кухонный остров": {
        "color": "Белый камень",
        "materials": "Дерево, камень",
        "dimensions": "220 × 90 × 90 см",
        "weight": Decimal("90"),
        "production_time": "10 недель",
        "made_to_order": True,
        "filters": [
            ("category", "Мебель"),
            ("color", "Белый камень"),
            ("texture", "Каменная"),
            ("material", "Дерево"),
            ("material", "Камень"),
            ("style", "Минимализм"),
            ("format", "Напольный"),
            ("subject", "Интерьер"),
        ],
    },
    "Композиция для стены": {
        "color": "Графит и молоко",
        "materials": "Бумага, дерево",
        "dimensions": "120 × 180 см",
        "weight": Decimal("4.5"),
        "production_time": "3 недели",
        "made_to_order": True,
        "filters": [
            ("category", "Живопись"),
            ("color", "Графит и молоко"),
            ("texture", "Матовая"),
            ("material", "Бумага"),
            ("material", "Дерево"),
            ("style", "Современный"),
            ("format", "Настенный"),
            ("subject", "Абстракция"),
        ],
    },
    "Напольный светильник": {
        "color": "Графит",
        "materials": "Металл",
        "dimensions": "высота 150 см",
        "weight": Decimal("7"),
        "production_time": "5 недель",
        "made_to_order": False,
        "filters": [
            ("category", "Декор"),
            ("color", "Графит"),
            ("texture", "Гладкая"),
            ("material", "Металл"),
            ("style", "Минимализм"),
            ("format", "Напольный"),
            ("subject", "Интерьер"),
        ],
    },
}

OPTIONS = [
    ("category", ["Скульптура", "Живопись", "Декор", "Мебель", "Текстиль"]),
    ("color", ["Натуральный дуб", "Молочный", "Белый камень", "Графит и молоко", "Графит"]),
    ("texture", ["Древесная", "Тканая", "Каменная", "Матовая", "Гладкая"]),
    ("material", ["Массив дуба", "Дерево", "Ткань", "Камень", "Бумага", "Металл"]),
    ("style", ["Минимализм", "Современный"]),
    ("format", ["Настенный", "Напольный"]),
    ("subject", ["Интерьер", "Абстракция"]),
]


def ensure_filters():
    stored = {}
    for kind, names in OPTIONS:
        for position, name in enumerate(names):
            row, _created = CatalogFilter.objects.get_or_create(
                kind=kind,
                name=name,
                defaults={"position": position},
            )
            stored[(kind, name)] = row
    return stored


def main():
    stored = ensure_filters()
    found = set()
    with transaction.atomic():
        for title, spec in SPECS.items():
            product = Product.objects.filter(title=title).first()
            if product is None:
                print(f"не найдено: {title}")
                continue
            found.add(title)
            product.color = spec["color"]
            product.materials = spec["materials"]
            product.dimensions = spec["dimensions"]
            product.weight = spec["weight"]
            product.production_time = spec["production_time"]
            product.made_to_order = spec["made_to_order"]
            product.save(
                update_fields=[
                    "color",
                    "materials",
                    "dimensions",
                    "weight",
                    "production_time",
                    "made_to_order",
                    "updated_at",
                ]
            )
            rows = []
            for kind, name in spec["filters"]:
                row = stored.get((kind, name))
                if row is None:
                    row, _created = CatalogFilter.objects.get_or_create(
                        kind=kind,
                        name=name,
                        defaults={"position": 100},
                    )
                    stored[(kind, name)] = row
                rows.append(row)
            product.filters.set(rows)
            print(f"заполнено: {title}")
    missing = set(SPECS) - found
    print(f"готово: {len(found)} из {len(SPECS)}")
    if missing:
        print("без совпадения по названию:", ", ".join(sorted(missing)))


if __name__ == "__main__":
    main()
