import django.contrib.auth.validators
import django.utils.timezone
from django.contrib.auth.hashers import make_password
from django.db import migrations, models


def seed_profiles(apps, schema_editor):
    User = apps.get_model("Catalog", "User")
    now = django.utils.timezone.now()
    password = make_password("Artbuild123")
    profiles = [
        ("anna.volkova", "anna.volkova@artbuild.ru", "+79000000001", "Анна", "Волкова", "master"),
        ("alexey.morozov", "alexey.morozov@artbuild.ru", "+79000000002", "Алексей", "Морозов", "master"),
        ("maria.lebedeva", "maria.lebedeva@artbuild.ru", "+79000000003", "Мария", "Лебедева", "master"),
        ("irina.sokolova", "irina.sokolova@artbuild.ru", "+79000000004", "Ирина", "Соколова", "customer"),
        ("pavel.nikitin", "pavel.nikitin@artbuild.ru", "+79000000005", "Павел", "Никитин", "customer"),
        ("olga.krylova", "olga.krylova@artbuild.ru", "+79000000006", "Ольга", "Крылова", "customer"),
        ("elena.belova", "elena.belova@artbuild.ru", "+79000000007", "Елена", "Белова", "designer"),
        ("kirill.orlov", "kirill.orlov@artbuild.ru", "+79000000008", "Кирилл", "Орлов", "designer"),
        ("darya.smirnova", "darya.smirnova@artbuild.ru", "+79000000009", "Дарья", "Смирнова", "designer"),
        ("sergey.kuznetsov", "sergey.kuznetsov@artbuild.ru", "+79000000010", "Сергей", "Кузнецов", "architect"),
        ("natalya.egorova", "natalya.egorova@artbuild.ru", "+79000000011", "Наталья", "Егорова", "architect"),
        ("ivan.petrov", "ivan.petrov@artbuild.ru", "+79000000012", "Иван", "Петров", "architect"),
    ]

    for username, email, phone, first_name, last_name, role in profiles:
        if User.objects.filter(username=username).exists():
            continue
        User.objects.create(
            username=username,
            email=email,
            phone=phone,
            first_name=first_name,
            last_name=last_name,
            role=role,
            password=password,
            is_active=True,
            is_staff=False,
            is_superuser=False,
            avatar="",
            email_verified_at=now,
            created_at=now,
            updated_at=now,
            date_joined=now,
        )


def remove_profiles(apps, schema_editor):
    User = apps.get_model("Catalog", "User")
    User.objects.filter(
        username__in=[
            "anna.volkova",
            "alexey.morozov",
            "maria.lebedeva",
            "irina.sokolova",
            "pavel.nikitin",
            "olga.krylova",
            "elena.belova",
            "kirill.orlov",
            "darya.smirnova",
            "sergey.kuznetsov",
            "natalya.egorova",
            "ivan.petrov",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("Catalog", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="last_login",
            field=models.DateTimeField(blank=True, null=True, verbose_name="last login"),
        ),
        migrations.AddField(
            model_name="user",
            name="is_superuser",
            field=models.BooleanField(
                default=False,
                help_text="Designates that this user has all permissions without explicitly assigning them.",
                verbose_name="superuser status",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="username",
            field=models.CharField(
                default="",
                error_messages={"unique": "A user with that username already exists."},
                help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                max_length=150,
                unique=True,
                validators=[django.contrib.auth.validators.UnicodeUsernameValidator()],
                verbose_name="username",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="user",
            name="date_joined",
            field=models.DateTimeField(
                default=django.utils.timezone.now,
                verbose_name="date joined",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="avatar",
            field=models.ImageField(default="", upload_to="avatars/"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("master", "Мастер"),
                    ("designer", "Дизайнер"),
                    ("architect", "Архитектор"),
                    ("customer", "Заказчик"),
                ],
                default="customer",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="password",
            field=models.CharField(max_length=130, verbose_name="password"),
        ),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(max_length=254, unique=True, verbose_name="email address"),
        ),
        migrations.AddField(
            model_name="user",
            name="groups",
            field=models.ManyToManyField(
                blank=True,
                help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                related_name="user_set",
                related_query_name="user",
                to="auth.group",
                verbose_name="groups",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="user_permissions",
            field=models.ManyToManyField(
                blank=True,
                help_text="Specific permissions for this user.",
                related_name="user_set",
                related_query_name="user",
                to="auth.permission",
                verbose_name="user permissions",
            ),
        ),
        migrations.RunPython(seed_profiles, remove_profiles),
    ]
