from django.db import migrations, models
import django.db.models.deletion


def keep_one_owner(apps, schema_editor):
    Image = apps.get_model('Catalog', 'PorfolioImage')
    seen = set()
    for row in Image.objects.all().order_by('id'):
        name = getattr(row.image, 'name', row.image) or ''
        if not name or name in seen:
            row.delete()
            continue
        seen.add(name)


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0016_catalog_filters'),
    ]

    operations = [
        migrations.RunPython(keep_one_owner, migrations.RunPython.noop),
        migrations.RenameField(
            model_name='porfolioimage',
            old_name='portfolio_id',
            new_name='portfolio',
        ),
        migrations.AlterField(
            model_name='porfolioimage',
            name='image',
            field=models.ImageField(unique=True, upload_to='portfolio/', verbose_name='Изображение'),
        ),
        migrations.AlterField(
            model_name='porfolioimage',
            name='portfolio',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='Catalog.portfolio', verbose_name='Портфолио'),
        ),
    ]
