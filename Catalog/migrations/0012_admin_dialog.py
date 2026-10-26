from django.db import migrations


def seed_admin_dialog(apps, schema_editor):
    Conversation = apps.get_model('Catalog', 'Conversation')
    ChatMessage = apps.get_model('Catalog', 'ChatMessage')
    User = apps.get_model('Catalog', 'User')
    if not User.objects.filter(pk=13).exists() or not User.objects.filter(pk=1).exists():
        return
    if Conversation.objects.filter(user_one_id=1, user_two_id=13).exists():
        return
    dialog = Conversation.objects.create(user_one_id=1, user_two_id=13)
    ChatMessage.objects.create(conversation=dialog, sender_id=13, text='Анна, проверьте новую заявку в каталоге.')
    ChatMessage.objects.create(conversation=dialog, sender_id=1, text='Посмотрела, отвечу заказчице сегодня.')


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0011_user_dialogs'),
    ]

    operations = [
        migrations.RunPython(seed_admin_dialog, migrations.RunPython.noop),
    ]
