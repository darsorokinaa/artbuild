import base64

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from Catalog.models import Task, TaskResponse, User
from Catalog.views import issue_token

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def photo(name="work.png"):
    return SimpleUploadedFile(name, PNG, content_type="image/png")


class TradeFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.artist = User.objects.create_user(
            username="artist@naidista.test",
            email="artist@naidista.test",
            password="password1",
            first_name="Анна",
            last_name="Лебедева",
            phone="79000000001",
            role=User.Role.MASTER,
        )
        self.other = User.objects.create_user(
            username="other@naidista.test",
            email="other@naidista.test",
            password="password1",
            first_name="Илья",
            last_name="Мороз",
            phone="79000000002",
            role=User.Role.MASTER,
        )
        self.customer = User.objects.create_user(
            username="customer@naidista.test",
            email="customer@naidista.test",
            password="password1",
            first_name="Мария",
            last_name="Соколова",
            phone="79000000003",
            role=User.Role.CUSTOMER,
        )

    def auth(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_token(user)}")

    def test_artist_publishes_product_into_catalog(self):
        self.auth(self.artist)
        created = self.client.post(
            "/api/products/",
            {
                "title": "Ваза",
                "description": "Керамическая ваза ручной работы",
                "price": "12500",
                "category": "Скульптура",
                "photos": photo(),
            },
            format="multipart",
        )
        self.assertEqual(created.status_code, 201, created.content)
        catalog = self.client.get("/api/catalog/")
        self.assertEqual(catalog.status_code, 200)
        match = next(item for item in catalog.json() if item["title"] == "Ваза")
        self.assertEqual(match["seller_id"], self.artist.id)
        self.assertEqual(match["filters"]["category"], "Скульптура")
        self.assertTrue(match["image"])

        self.auth(self.customer)
        denied = self.client.post(
            "/api/products/",
            {
                "title": "Чужая",
                "description": "Не должна сохраниться",
                "price": "1000",
                "category": "Декор",
                "photos": photo("no.png"),
            },
            format="multipart",
        )
        self.assertEqual(denied.status_code, 403)

    def test_customer_hires_one_artist(self):
        self.auth(self.customer)
        created = self.client.post(
            "/api/tasks/",
            {
                "title": "Портрет",
                "description": "Портрет маслом по фотографии",
                "category": "Живопись",
                "budget": "40000",
                "budget_kind": "up_to",
                "deadline": "3 недели",
                "photos": photo("ref.png"),
            },
            format="multipart",
        )
        self.assertEqual(created.status_code, 201, created.content)
        task_id = created.json()["id"]
        self.assertEqual(created.json()["budget_label"], "до 40 000 ₽")
        self.assertEqual(len(created.json()["images"]), 1)

        self.auth(self.artist)
        denied = self.client.post(
            "/api/tasks/",
            {
                "title": "Не задача художника",
                "description": "Художник не создаёт задачи",
                "category": "Декор",
                "budget": "1000",
                "deadline": "неделя",
            },
            format="multipart",
        )
        self.assertEqual(denied.status_code, 403)

        first = self.client.post(
            f"/api/tasks/{task_id}/responses/",
            {
                "price": "35000",
                "deadline": "2 недели",
                "message": "Могу написать портрет маслом",
                "examples": photo("example.png"),
            },
            format="multipart",
        )
        self.assertEqual(first.status_code, 201, first.content)
        again = self.client.post(
            f"/api/tasks/{task_id}/responses/",
            {"price": "30000", "deadline": "неделя", "message": "Повтор"},
            format="multipart",
        )
        self.assertEqual(again.status_code, 400)

        self.auth(self.other)
        second = self.client.post(
            f"/api/tasks/{task_id}/responses/",
            {"price": "28000", "deadline": "10 дней", "message": "Готов взяться"},
            format="multipart",
        )
        self.assertEqual(second.status_code, 201, second.content)

        self.auth(self.customer)
        chosen = self.client.post(
            f"/api/tasks/{task_id}/choose/",
            {"response_id": first.json()["id"]},
            format="json",
        )
        self.assertEqual(chosen.status_code, 200, chosen.content)
        body = chosen.json()
        self.assertEqual(body["status"], Task.Status.IN_PROGRESS)
        self.assertEqual(body["assignee_id"], self.artist.id)
        self.assertEqual([item["id"] for item in body["responses"]], [first.json()["id"]])

        hidden = TaskResponse.objects.get(pk=second.json()["id"])
        self.assertEqual(hidden.status, TaskResponse.Status.REJECTED)

        self.auth(self.other)
        detail = self.client.get(f"/api/tasks/{task_id}/")
        self.assertEqual(detail.json()["my_response"]["status"], TaskResponse.Status.REJECTED)
        self.assertNotIn("responses", detail.json())

        self.auth(self.customer)
        account = self.client.get("/api/account/")
        self.assertEqual(account.json()["kind"], "customer")
        self.assertEqual(account.json()["tasks"][0]["title"], "Портрет")
        self.assertTrue(any("Новый отклик" in item["text"] for item in account.json()["notices"]))

        self.auth(self.artist)
        cabinet = self.client.get("/api/account/")
        self.assertEqual(cabinet.json()["responses"][0]["task_title"], "Портрет")
        self.assertEqual(cabinet.json()["responses"][0]["status"], TaskResponse.Status.CHOSEN)
        self.assertTrue(any("выбрали" in item["text"].lower() for item in cabinet.json()["notices"]))

        feed = self.client.get("/api/tasks/?status=in_progress")
        self.assertTrue(any(item["id"] == task_id for item in feed.json()))
