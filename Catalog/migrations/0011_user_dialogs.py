import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def clear_old_dialogs(apps, schema_editor):
    apps.get_model('Catalog', 'ChatMessage').objects.all().delete()
    apps.get_model('Catalog', 'Conversation').objects.all().delete()


def seed_dialogs(apps, schema_editor):
    Conversation = apps.get_model('Catalog', 'Conversation')
    ChatMessage = apps.get_model('Catalog', 'ChatMessage')
    User = apps.get_model('Catalog', 'User')
    known = set(User.objects.values_list('id', flat=True))
    threads = [
        (1, 4, [(4, 'Анна, можно обсудить роспись для гостиной?'), (1, 'Да, пришлите размеры стены.')]),
        (2, 4, [(4, 'Интересует подвесной шкаф.'), (2, 'Могу снять размеры на следующей неделе.')]),
        (3, 4, [(4, 'Светильник ещё свободен?'), (3, 'Да, могу отложить его для вас.')]),
        (4, 10, [(4, 'Нужен проект дома с двором.'), (10, 'Пришлите участок и пожелания по свету.')]),
        (2, 5, [(5, 'Можно заказать стол из ясеня?'), (2, 'Да, уточните длину столешницы.')]),
        (2, 12, [(12, 'Нужна мебель для павильона.'), (2, 'Соберу эскиз по вашим чертежам.')]),
        (3, 6, [(6, 'Хочу текстиль в тон спальне.'), (3, 'Подберу лён и пришлю образцы.')]),
        (3, 9, [(3, 'Дарья, для спальни нужен мягкий свет.'), (9, 'Оставлю тёплый сценарий у кровати.')]),
        (1, 8, [(8, 'Нужна роспись на кухне с островом.'), (1, 'Сделаю спокойный графический рисунок.')]),
        (5, 7, [(5, 'Елена, посмотрите гостиную.'), (7, 'Соберу палитру и план мебели.')]),
        (6, 11, [(6, 'Нужна планировка квартиры в цехе.'), (11, 'Начну с света и высоты потолка.')]),
        (7, 10, [(7, 'Сергей, согласуем фасад и двор.'), (10, 'Пришлю разрез и вид со двора.')]),
        (8, 11, [(8, 'Наталья, кухня готова к привязке.'), (11, 'Проверю выводы и ниши.')]),
        (9, 12, [(9, 'Иван, для павильона нужен чертёж.'), (12, 'Отправлю план и фасад.')]),
    ]
    for one_id, two_id, lines in threads:
        if one_id not in known or two_id not in known:
            continue
        dialog = Conversation.objects.create(user_one_id=one_id, user_two_id=two_id)
        for sender_id, text in lines:
            ChatMessage.objects.create(conversation=dialog, sender_id=sender_id, text=text)


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0010_conversations'),
    ]

    operations = [
        migrations.RunPython(clear_old_dialogs, migrations.RunPython.noop),
        migrations.RemoveConstraint(
            model_name='conversation',
            name='unique_product_visitor_chat',
        ),
        migrations.RemoveField(model_name='conversation', name='author'),
        migrations.RemoveField(model_name='conversation', name='product'),
        migrations.RemoveField(model_name='conversation', name='visitor_key'),
        migrations.AddField(
            model_name='conversation',
            name='user_one',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dialogs_as_one', to=settings.AUTH_USER_MODEL, verbose_name='Участник 1'),
        ),
        migrations.AddField(
            model_name='conversation',
            name='user_two',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dialogs_as_two', to=settings.AUTH_USER_MODEL, verbose_name='Участник 2'),
        ),
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(fields=('user_one', 'user_two'), name='unique_user_pair'),
        ),
        migrations.RemoveField(model_name='chatmessage', name='from_author'),
        migrations.AddField(
            model_name='chatmessage',
            name='sender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL, verbose_name='Отправитель'),
        ),
        migrations.RunPython(seed_dialogs, migrations.RunPython.noop),
    ]
