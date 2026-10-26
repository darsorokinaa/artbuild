import json

from django.core import signing
from django.db import transaction
from django.db.models import Case, IntegerField, Prefetch, Q, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Conversation, PorfolioImage, Portfolio, Product, User
from .serializers import ProductSerializer


@api_view(['GET'])
def catalog(request):
    products = (
        Product.objects.filter(status=Product.Status.PUBLISHED)
        .select_related('seller', 'product_type')
        .prefetch_related('images', 'reviews__author')
    )
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


def masters_queryset():
    role_order = Case(
        When(role=User.Role.MASTER, then=Value(0)),
        When(role=User.Role.DESIGNER, then=Value(1)),
        When(role=User.Role.ARCHITECT, then=Value(2)),
        default=Value(3),
        output_field=IntegerField(),
    )
    return (
        User.objects.filter(role__in=[User.Role.MASTER, User.Role.DESIGNER, User.Role.ARCHITECT])
        .annotate(role_order=role_order)
        .order_by('role_order', 'id')
        .prefetch_related(
            Prefetch(
                'portfolios',
                queryset=Portfolio.objects.filter(
                    main=True,
                    status=Portfolio.Status.PUBLISHED,
                ).prefetch_related('images'),
                to_attr='main_works',
            )
        )
    )


def work_images(request, work):
    return [
        {
            'src': request.build_absolute_uri(photo.image.url),
            'description': photo.description,
        }
        for photo in work.images.all()
        if photo.image
    ]


def work_payload(request, work):
    images = work_images(request, work)
    return {
        'id': work.id,
        'title': work.portfolio_title,
        'description': work.portfolio_description,
        'duration': work.duration,
        'image': images[0]['src'] if images else None,
        'images': images,
    }


def product_image(request, product):
    photos = [photo for photo in product.images.all() if photo.image]
    photo = next((item for item in photos if item.is_main), None) or (photos[0] if photos else None)
    if photo is None:
        return None
    return request.build_absolute_uri(photo.image.url)


def product_payload(request, product):
    reviews = [
        {
            'id': review.id,
            'author': f'{review.author.first_name} {review.author.last_name}'.strip(),
            'rating': review.rating,
            'text': review.text,
        }
        for review in product.reviews.all()
    ]
    scores = [item['rating'] for item in reviews]
    return {
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'price': str(product.price),
        'image': product_image(request, product),
        'sphere': product.product_type.get_sphere_display() if product.product_type_id else '',
        'production_time': product.production_time,
        'reviews': reviews,
        'rating': round(sum(scores) / len(scores), 1) if scores else None,
    }


def master_payload(request, person):
    name = f'{person.first_name} {person.last_name}'.strip()
    avatar = request.build_absolute_uri(person.avatar.url) if person.avatar else None
    works = [work_payload(request, work) for work in getattr(person, 'main_works', [])]
    return {
        'id': person.id,
        'name': name,
        'role': person.role,
        'avatar': avatar,
        'description': person.description,
        'works': works,
    }


@api_view(['GET'])
def masters(request):
    cards = []
    for person in masters_queryset():
        profile = master_payload(request, person)
        works = profile['works'] or [None]
        for work in works:
            cards.append({
                'id': work['id'] if work else person.id,
                'user_id': person.id,
                'name': profile['name'],
                'role': profile['role'],
                'avatar': profile['avatar'],
                'description': profile['description'],
                'title': work['title'] if work else '',
                'image': work['image'] if work else None,
                'images': work['images'] if work else [],
                'duration': work['duration'] if work else '',
            })
    return Response(cards)


@api_view(['GET'])
def master_detail(request, user_id):
    person = get_object_or_404(masters_queryset(), pk=user_id)
    profile = master_payload(request, person)
    portfolios = (
        Portfolio.objects.filter(
            portfolio_owner=person,
            status=Portfolio.Status.PUBLISHED,
        )
        .prefetch_related('images')
        .order_by('-main', '-created_at')
    )
    products = (
        Product.objects.filter(seller=person, status=Product.Status.PUBLISHED)
        .select_related('product_type')
        .prefetch_related('images', 'reviews__author')
    )
    profile['portfolios'] = [work_payload(request, work) for work in portfolios]
    profile['products'] = [product_payload(request, product) for product in products]
    return Response(profile)


def person_name(user):
    return f'{user.first_name} {user.last_name}'.strip()


ACCOUNT_TOKEN_SALT = 'artbuild-account'
ROLE_LABELS = {
    User.Role.MASTER: 'Мастер',
    User.Role.DESIGNER: 'Дизайнер',
    User.Role.ARCHITECT: 'Архитектор',
    User.Role.CUSTOMER: 'Заказчик',
}
MASTER_ROLES = {User.Role.MASTER, User.Role.DESIGNER, User.Role.ARCHITECT}


def issue_token(user):
    return signing.dumps({'id': user.id}, salt=ACCOUNT_TOKEN_SALT)


def read_user(request):
    header = request.headers.get('Authorization', '')
    token = header[7:].strip() if header.startswith('Bearer ') else ''
    if token:
        try:
            payload = signing.loads(token, salt=ACCOUNT_TOKEN_SALT, max_age=60 * 60 * 24 * 30)
            user = User.objects.filter(pk=payload.get('id')).first()
        except (signing.BadSignature, signing.SignatureExpired, TypeError, ValueError):
            user = None
        if user is not None:
            return user
    try:
        user_id = int(request.headers.get('X-User', ''))
    except (TypeError, ValueError):
        return None
    return User.objects.filter(pk=user_id).first()


def account_payload(user):
    return {
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone': user.phone or '',
        'role': user.role,
        'role_label': ROLE_LABELS.get(user.role, user.role),
        'description': user.description or '',
    }


def ordered_pair(left_id, right_id):
    if left_id == right_id:
        return None
    return (left_id, right_id) if left_id < right_id else (right_id, left_id)


def user_dialogs(user):
    return (
        Conversation.objects.filter(Q(user_one=user) | Q(user_two=user))
        .select_related('user_one', 'user_two')
        .order_by('-id')
    )


def other_person(conversation, user):
    if conversation.user_one_id == user.id:
        return conversation.user_two
    return conversation.user_one


def dialog_list(user):
    items = []
    for conversation in user_dialogs(user):
        other = other_person(conversation, user)
        stored = conversation.messages or []
        items.append({
            'id': conversation.id,
            'with_id': other.id,
            'with_name': person_name(other),
            'last_text': stored[-1]['text'] if stored else '',
        })
    return items


def price_label(value):
    digits = str(int(round(float(value))))
    groups = []
    while digits:
        groups.append(digits[-3:])
        digits = digits[:-3]
    return f"{' '.join(reversed(groups))} ₽"


def message_line(item, user, people):
    line = {
        'id': item['id'],
        'text': item['text'],
        'mine': item['sender_id'] == user.id,
        'sender_name': person_name(people[item['sender_id']]) if item['sender_id'] in people else '',
    }
    for key in ('title', 'image', 'description', 'price', 'production_time'):
        if item.get(key):
            line[key] = item[key]
    return line


def product_draft(product, request):
    lines = [
        'Здравствуйте! Заинтересовал этот товар',
        product.title,
    ]
    if product.description:
        lines.append(product.description)
    lines.append(f'Стоимость: {price_label(product.price)}')
    lines.append(f'Сроки: {product.production_time or "не указаны"}')
    return {
        'text': '\n\n'.join(lines),
        'image': product_image(request, product) or '',
    }


def thread_payload(conversation, user):
    other = other_person(conversation, user)
    stored = conversation.messages or []
    people = {
        person.id: person
        for person in User.objects.filter(pk__in={item['sender_id'] for item in stored})
    }
    return {
        'id': conversation.id,
        'with_id': other.id,
        'with_name': person_name(other),
        'me_id': user.id,
        'me_name': person_name(user),
        'dialogs': dialog_list(user),
        'messages': [message_line(item, user, people) for item in stored],
    }


def load_thread(conversation_id, user):
    return get_object_or_404(
        Conversation.objects.select_related('user_one', 'user_two'),
        Q(user_one=user) | Q(user_two=user),
        pk=conversation_id,
    )


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def open_conversation(request):
    user = read_user(request)
    if user is None:
        return Response({'detail': 'Пользователь не найден.'}, status=400)
    if request.method == 'GET':
        return Response({'me_id': user.id, 'me_name': person_name(user), 'dialogs': dialog_list(user)})
    try:
        product_id = int(request.data.get('product_id'))
    except (TypeError, ValueError):
        return Response({'detail': 'Товар не указан.'}, status=400)
    product = get_object_or_404(
        Product.objects.select_related('seller').prefetch_related('images'),
        pk=product_id,
        status=Product.Status.PUBLISHED,
    )
    pair = ordered_pair(user.id, product.seller_id or 0)
    if pair is None or product.seller_id is None:
        return Response({'detail': 'Нельзя открыть диалог с собой.'}, status=400)
    conversation, _created = Conversation.objects.get_or_create(
        user_one_id=pair[0],
        user_two_id=pair[1],
    )
    conversation = load_thread(conversation.id, user)
    payload = thread_payload(conversation, user)
    payload['draft'] = product_draft(product, request)
    return Response(payload)


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def conversation_detail(request, conversation_id):
    user = read_user(request)
    if user is None:
        return Response({'detail': 'Пользователь не найден.'}, status=400)
    conversation = load_thread(conversation_id, user)
    if request.method == 'POST':
        text = str(request.data.get('text') or '').strip()
        if not text:
            return Response({'detail': 'Напишите сообщение.'}, status=400)
        if len(text) > 4000:
            return Response({'detail': 'Слишком длинное сообщение.'}, status=400)
        image = str(request.data.get('image') or '').strip()
        stored = list(conversation.messages or [])
        next_id = max((item.get('id') or 0) for item in stored) + 1 if stored else 1
        message = {
            'id': next_id,
            'sender_id': user.id,
            'text': text,
            'created_at': timezone.now().isoformat(),
        }
        if image:
            message['image'] = image
        stored.append(message)
        conversation.messages = stored
        conversation.save(update_fields=['messages'])
    return Response(thread_payload(conversation, user))


def image_problem(upload):
    if upload is None:
        return 'missing'
    content_type = str(getattr(upload, 'content_type', '') or '').lower()
    name = str(getattr(upload, 'name', '') or '').lower()
    looks_like_image = content_type.startswith('image/') or name.endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif'))
    if not looks_like_image:
        return 'Нужны фотографии.'
    if upload.size > 8 * 1024 * 1024:
        return 'Фотография больше 8 МБ.'
    return ''


def master_materials(request):
    description = str(request.data.get('portfolio_description') or '').strip()
    images = list(request.FILES.getlist('portfolio'))
    if not description:
        return None, 'Опишите портфолио.'
    if len(images) != 1:
        return None, 'У портфолио одно основное фото.'
    for upload in images:
        problem = image_problem(upload)
        if problem:
            return None, problem
    try:
        works = json.loads(request.data.get('works') or '[]')
    except (TypeError, json.JSONDecodeError):
        return None, 'Добавьте хотя бы одну работу.'
    if not isinstance(works, list) or not works:
        return None, 'Добавьте хотя бы одну работу.'
    prepared = []
    for index, work in enumerate(works):
        if not isinstance(work, dict):
            return None, 'Добавьте хотя бы одну работу.'
        title = str(work.get('title') or '').strip()
        text = str(work.get('description') or '').strip()
        if not title or not text:
            return None, 'Укажите название и описание работы.'
        if len(title) > 300:
            return None, 'Название работы слишком длинное.'
        photos = [request.FILES.get(f'work_{index}_{slot}') for slot in range(3)]
        if any(photo is None for photo in photos):
            return None, 'У каждой работы должно быть три фотографии.'
        for photo in photos:
            problem = image_problem(photo)
            if problem:
                return None, problem
        prepared.append((title, text, photos))
    return (description, images, prepared), ''


def save_master_materials(user, materials):
    description, images, works = materials
    cover = Portfolio.objects.create(
        portfolio_owner=user,
        portfolio_title='Портфолио',
        portfolio_description=description,
        main=True,
        status=Portfolio.Status.DRAFT,
    )
    for image in images:
        PorfolioImage.objects.create(portfolio_id=cover, image=image)
    for title, text, photos in works:
        work = Portfolio.objects.create(
            portfolio_owner=user,
            portfolio_title=title,
            portfolio_description=text,
            status=Portfolio.Status.DRAFT,
        )
        for photo in photos:
            PorfolioImage.objects.create(portfolio_id=work, image=photo)


def registration_fields(data):
    return {
        'kind': str(data.get('kind') or '').strip(),
        'first_name': str(data.get('first_name') or '').strip(),
        'last_name': str(data.get('last_name') or '').strip(),
        'email': str(data.get('email') or '').strip().lower(),
        'phone': str(data.get('phone') or '').strip(),
        'password': str(data.get('password') or ''),
        'specialty': str(data.get('specialty') or '').strip(),
        'description': str(data.get('description') or '').strip(),
    }


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    fields = registration_fields(request.data)
    if fields['kind'] not in {'master', 'customer'}:
        return Response({'detail': 'Выберите, кто регистрируется.'}, status=400)
    if not fields['first_name'] or not fields['last_name']:
        return Response({'detail': 'Укажите имя и фамилию.'}, status=400)
    if '@' not in fields['email'] or len(fields['email']) < 5:
        return Response({'detail': 'Укажите почту.'}, status=400)
    if len(fields['phone']) < 6:
        return Response({'detail': 'Укажите телефон.'}, status=400)
    if len(fields['password']) < 8:
        return Response({'detail': 'Пароль должен быть не короче 8 символов.'}, status=400)
    if User.objects.filter(email__iexact=fields['email']).exists():
        return Response({'detail': 'Такая почта уже зарегистрирована.'}, status=400)
    if User.objects.filter(phone=fields['phone']).exists():
        return Response({'detail': 'Такой телефон уже зарегистрирован.'}, status=400)
    materials = None
    if fields['kind'] == 'master':
        if fields['specialty'] not in MASTER_ROLES:
            return Response({'detail': 'Выберите специальность.'}, status=400)
        if not fields['description']:
            return Response({'detail': 'Напишите краткое резюме.'}, status=400)
        materials, problem = master_materials(request)
        if problem:
            return Response({'detail': problem}, status=400)
        role = fields['specialty']
        description = fields['description']
    else:
        role = User.Role.CUSTOMER
        description = ''
    with transaction.atomic():
        user = User.objects.create_user(
            username=fields['email'],
            email=fields['email'],
            password=fields['password'],
            first_name=fields['first_name'],
            last_name=fields['last_name'],
            phone=fields['phone'],
            role=role,
            description=description,
        )
        if materials is not None:
            save_master_materials(user, materials)
    return Response({'token': issue_token(user), 'user': account_payload(user)})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get('email') or '').strip().lower()
    password = str(request.data.get('password') or '')
    user = User.objects.filter(email__iexact=email).first()
    if user is None or not user.check_password(password):
        return Response({'detail': 'Неверная почта или пароль.'}, status=400)
    return Response({'token': issue_token(user), 'user': account_payload(user)})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def account_home(request):
    user = read_user(request)
    if user is None:
        return Response({'detail': 'Войдите в учётную запись.'}, status=401)
    payload = {
        'user': account_payload(user),
        'dialogs': dialog_list(user),
        'kind': 'customer' if user.role == User.Role.CUSTOMER else 'master',
    }
    if payload['kind'] == 'master':
        portfolios = []
        works = user.portfolios.prefetch_related('images').order_by('-main', '-created_at')
        for work in works:
            item = work_payload(request, work)
            item['status'] = work.get_status_display()
            item['main'] = work.main
            portfolios.append(item)
        payload['portfolios'] = portfolios
        products = user.products.select_related('product_type').prefetch_related('images', 'reviews__author')
        payload['products'] = [
            {**product_payload(request, product), 'status': product.get_status_display()}
            for product in products
        ]
    return Response(payload)