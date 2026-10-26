from django.db import migrations


CREATE_NEW = """
CREATE TABLE "django_admin_log__new" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "object_id" text NULL,
    "object_repr" varchar(200) NOT NULL,
    "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0),
    "change_message" text NOT NULL,
    "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NOT NULL REFERENCES "Catalog_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "action_time" datetime NOT NULL
)
"""


def point_admin_log_at_catalog_user(apps, schema_editor):
    if schema_editor.connection.vendor != "sqlite":
        return
    schema_editor.execute("DROP TABLE IF EXISTS django_admin_log__new")
    schema_editor.execute(CREATE_NEW)
    schema_editor.execute(
        """
        INSERT INTO django_admin_log__new (
            id, object_id, object_repr, action_flag, change_message,
            content_type_id, user_id, action_time
        )
        SELECT
            id, object_id, object_repr, action_flag, change_message,
            content_type_id, user_id, action_time
        FROM django_admin_log
        WHERE user_id IN (SELECT id FROM Catalog_user)
        """
    )
    schema_editor.execute("DROP TABLE django_admin_log")
    schema_editor.execute("ALTER TABLE django_admin_log__new RENAME TO django_admin_log")
    schema_editor.execute(
        'CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" ("content_type_id")'
    )
    schema_editor.execute(
        'CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log" ("user_id")'
    )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("Catalog", "0014_product_reviews"),
        ("admin", "0003_logentry_add_action_flag_choices"),
    ]

    operations = [
        migrations.RunPython(point_admin_log_at_catalog_user, migrations.RunPython.noop),
    ]
