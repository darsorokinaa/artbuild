from django.db import migrations, models


def copy_messages_into_dialog(apps, schema_editor):
    Conversation = apps.get_model('Catalog', 'Conversation')
    ChatMessage = apps.get_model('Catalog', 'ChatMessage')
    for dialog in Conversation.objects.all():
        rows = ChatMessage.objects.filter(conversation_id=dialog.id).order_by('created_at', 'id')
        dialog.messages = [
            {
                'id': row.id,
                'sender_id': row.sender_id,
                'text': row.text,
                'created_at': row.created_at.isoformat(),
            }
            for row in rows
        ]
        dialog.save(update_fields=['messages'])


class Migration(migrations.Migration):

    dependencies = [
        ('Catalog', '0012_admin_dialog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatmessage',
            name='conversation',
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name='message_rows',
                to='Catalog.conversation',
                verbose_name='Диалог',
            ),
        ),
        migrations.AddField(
            model_name='conversation',
            name='messages',
            field=models.JSONField(blank=True, default=list, verbose_name='Сообщения'),
        ),
        migrations.RunPython(copy_messages_into_dialog, migrations.RunPython.noop),
        migrations.DeleteModel(
            name='ChatMessage',
        ),
    ]
