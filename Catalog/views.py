import json
from decimal import Decimal, InvalidOperation

from django.core import signing
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Prefetch, Q, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import (
    CatalogFilter,
    Conversation,
    MakerProfile,
    Notice,
    PorfolioImage,
    Portfolio,
    Product,
    ProductImage,
    ProductType,
    Task,
    TaskImage,
    TaskResponse,
    TaskResponseImage,
    User,
)
from .serializers import ProductSerializer


@api_view(['GET'])
def catalog(request):
    products = (
        Product.objects.filter(status=Product.Status.PUBLISHED)
        .select_related('seller', 'product_type')
        .prefetch_related('images', 'reviews__author', 'filters')
    )
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def catalog_filters(request):
    grouped = {kind: [] for kind, _label in CatalogFilter.Kind.choices}
    for item in CatalogFilter.objects.all():
        grouped[item.kind].append(item.name)
    return Response(grouped)


def masters_queryset():
    role_order = Case(
        When(role=User.Role.MASTER, then=Value(0)),
        When(role=User.Role.DESIGNER, then=Value(1)),
        When(role=User.Role.ARCHITECT, then=Value(2)),
        default=Value(3),
        output_field=IntegerField(),
    )
    return (
        User.objects.filter(role__in=[User.Role.MASTER, User.Role.DESIGNER, User.Role.ARCHITECT, User.Role.ORGANIZATION])
        .annotate(role_order=role_order)
        .order_by('role_order', 'id')
        .select_related('maker_profile')
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
    photos = sorted(
        (photo for photo in work.images.all() if photo.image),
        key=lambda photo: (photo.sort_order, photo.id),
    )
    return [
        {
            'src': request.build_absolute_uri(photo.image.url),
            'description': photo.description,
        }
        for photo in photos
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


def grouped_filters(product):
    grouped = {
        'category': '',
        'color': '',
        'texture': '',
        'material': [],
        'style': '',
        'format': '',
        'subject': '',
    }
    for item in product.filters.all():
        if item.kind == 'material':
            grouped['material'].append(item.name)
        elif item.kind in grouped and not grouped[item.kind]:
            grouped[item.kind] = item.name
    grouped['material'].sort()
    return grouped


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
        'color': product.color,
        'materials': product.materials,
        'dimensions': product.dimensions,
        'weight': str(product.weight) if product.weight is not None else '',
        'made_to_order': product.made_to_order,
        'filters': grouped_filters(product),
        'production_time': product.production_time,
        'reviews': reviews,
        'rating': round(sum(scores) / len(scores), 1) if scores else None,
    }


WORK_CRAFTS = {
    'painting': 'Живопись',
    'graphic': 'Живопись',
    'furniture': 'Мебель',
    'sculpture': 'Скульптура',
    'textile': 'Текстиль',
    'tableware': 'Посуда',
    'plaster': 'Декор',
    'mosaic': 'Декор',
    'events': 'Декор',
}


def maker_crafts(person):
    try:
        profile = person.maker_profile
    except MakerProfile.DoesNotExist:
        return []
    crafts = []
    for code in profile.works or []:
        label = WORK_CRAFTS.get(code)
        if label and label not in crafts:
            crafts.append(label)
    return crafts


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
                'crafts': maker_crafts(person),
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
        .prefetch_related('images', 'reviews__author', 'filters')
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
    User.Role.ORGANIZATION: 'Организация',
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
    try:
        portfolios = json.loads(request.data.get('portfolios') or '[]')
    except (TypeError, json.JSONDecodeError):
        return None, 'Добавьте портфолио.'
    if not isinstance(portfolios, list) or not portfolios:
        return None, 'Добавьте портфолио.'
    prepared = []
    for index, item in enumerate(portfolios):
        if not isinstance(item, dict):
            return None, 'Добавьте портфолио.'
        title = str(item.get('title') or '').strip()
        text = str(item.get('description') or '').strip()
        if not title or not text:
            return None, 'Укажите название и описание работы.'
        if len(title) > 300:
            return None, 'Название работы слишком длинное.'
        captions = item.get('photos')
        if not isinstance(captions, list) or not captions:
            return None, 'Добавьте фотографию портфолио.'
        photos = []
        for slot, caption in enumerate(captions):
            upload = request.FILES.get(f'portfolio_{index}_{slot}')
            problem = image_problem(upload)
            if problem == 'missing':
                return None, 'Добавьте фотографию портфолио.'
            if problem:
                return None, problem
            description = str(caption.get('description') or '').strip() if isinstance(caption, dict) else ''
            if not description:
                return None, 'Добавьте описание к каждой фотографии.'
            photos.append((upload, description))
        prepared.append((title, text, photos))
    return prepared, ''


def save_master_materials(user, portfolios):
    for index, (title, text, photos) in enumerate(portfolios):
        work = Portfolio.objects.create(
            portfolio_owner=user,
            portfolio_title=title,
            portfolio_description=text,
            main=index == 0,
            status=Portfolio.Status.DRAFT,
        )
        for order, (photo, description) in enumerate(photos):
            PorfolioImage.objects.create(
                portfolio=work,
                image=photo,
                description=description,
                sort_order=order,
            )


ARTIST_WORKS = {
    'painting', 'graphic', 'furniture', 'photo', 'sculpture', 'textile', 'tableware', 'other',
}
ORGANIZATION_WORKS = {'plaster', 'furniture', 'mosaic', 'events', 'other'}
ARTIST_MATERIALS = {'watercolor', 'oil', 'ceramic', 'plaster', 'wood'}
ORGANIZATION_MATERIALS = {'plastic', 'gypsum', 'ceramic', 'plaster', 'wood', 'other'}


def chosen_codes(raw, allowed):
    try:
        values = json.loads(raw or '[]')
    except (TypeError, json.JSONDecodeError):
        return None
    if not isinstance(values, list):
        return None
    codes = []
    for value in values:
        code = str(value or '').strip()
        if code not in allowed or code in codes:
            continue
        codes.append(code)
    return codes


def work_uploads(request):
    photos = []
    index = 0
    while True:
        upload = request.FILES.get(f'work_{index}')
        if upload is None:
            break
        problem = image_problem(upload)
        if problem:
            return None, 'Нужны фотографии.' if problem == 'missing' else problem
        photos.append(upload)
        index += 1
        if index > 12:
            return None, 'Слишком много фотографий.'
    return photos, ''


def register_maker(request, fields):
    kind = fields['kind']
    if not fields['email'] or '@' not in fields['email'] or len(fields['email']) < 5:
        return Response({'detail': 'Укажите почту.'}, status=400)
    if len(fields['phone']) < 6:
        return Response({'detail': 'Укажите телефон.'}, status=400)
    if len(fields['password']) < 8:
        return Response({'detail': 'Пароль должен быть не короче 8 символов.'}, status=400)
    if User.objects.filter(email__iexact=fields['email']).exists():
        return Response({'detail': 'Такая почта уже зарегистрирована.'}, status=400)
    if User.objects.filter(phone=fields['phone']).exists():
        return Response({'detail': 'Такой телефон уже зарегистрирован.'}, status=400)
    display_name = str(request.data.get('display_name') or '').strip()
    description = fields['description']
    photo_choice = str(request.data.get('photo_choice') or '').strip()
    if photo_choice not in {MakerProfile.PhotoChoice.OWN, MakerProfile.PhotoChoice.STUDIO}:
        return Response({'detail': 'Выберите, как поступить с фотографиями.'}, status=400)
    if kind == 'artist':
        works = chosen_codes(request.data.get('works'), ARTIST_WORKS)
        materials = chosen_codes(request.data.get('materials'), ARTIST_MATERIALS)
        work_allowed = ARTIST_WORKS
    else:
        works = chosen_codes(request.data.get('works'), ORGANIZATION_WORKS)
        materials = chosen_codes(request.data.get('materials'), ORGANIZATION_MATERIALS)
        work_allowed = ORGANIZATION_WORKS
    if works is None or materials is None:
        return Response({'detail': 'Выберите варианты из списка.'}, status=400)
    work_other = str(request.data.get('work_other') or '').strip()
    material_other = str(request.data.get('material_other') or '').strip()
    if not works or ('other' in works and not work_other):
        return Response({'detail': 'Выберите, чем вы занимаетесь.'}, status=400)
    if 'other' not in work_allowed:
        work_other = ''
    if not materials or ('other' in materials and not material_other):
        return Response({'detail': 'Выберите материалы.'}, status=400)
    if kind != 'organization':
        material_other = ''
    if not display_name:
        return Response({'detail': 'Укажите название компании.' if kind == 'organization' else 'Укажите имя или псевдоним.'}, status=400)
    if len(display_name) > 150:
        return Response({'detail': 'Имя слишком длинное.'}, status=400)
    if not description:
        return Response({'detail': 'Опишите предлагаемые работы.' if kind == 'organization' else 'Опишите ваше искусство.'}, status=400)
    age = None
    education = ''
    if kind == 'artist':
        raw_age = str(request.data.get('age') or '').strip()
        if not raw_age.isdigit() or not 1 <= int(raw_age) <= 120:
            return Response({'detail': 'Укажите возраст.'}, status=400)
        age = int(raw_age)
        education = str(request.data.get('education') or '').strip()
        if not education:
            return Response({'detail': 'Укажите образование.'}, status=400)
    portrait = request.FILES.get('portrait')
    portrait_problem = image_problem(portrait)
    if portrait_problem == 'missing':
        return Response({'detail': 'Добавьте логотип.' if kind == 'organization' else 'Добавьте фото.'}, status=400)
    if portrait_problem:
        return Response({'detail': portrait_problem}, status=400)
    photos, photo_problem = work_uploads(request)
    if photo_problem:
        return Response({'detail': photo_problem}, status=400)
    if photo_choice == MakerProfile.PhotoChoice.OWN and not photos:
        return Response({'detail': 'Добавьте фотографии работ.'}, status=400)
    role = User.Role.MASTER if kind == 'artist' else User.Role.ORGANIZATION
    with transaction.atomic():
        user = User.objects.create_user(
            username=fields['email'],
            email=fields['email'],
            password=fields['password'],
            first_name=display_name,
            last_name='',
            phone=fields['phone'],
            role=role,
            description=description,
        )
        user.avatar.save(portrait.name, portrait, save=True)
        MakerProfile.objects.create(
            user=user,
            kind=kind,
            works=works,
            work_other=work_other if 'other' in works else '',
            photo_choice=photo_choice,
            age=age,
            education=education,
            materials=materials,
            material_other=material_other if 'other' in materials else '',
        )
        if photos:
            work = Portfolio.objects.create(
                portfolio_owner=user,
                portfolio_title='Работы',
                portfolio_description=description,
                main=True,
                status=Portfolio.Status.DRAFT,
            )
            for order, photo in enumerate(photos):
                PorfolioImage.objects.create(
                    portfolio=work,
                    image=photo,
                    description='Фото работы',
                    sort_order=order,
                )
    return Response({'token': issue_token(user), 'user': account_payload(user)})


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
    if fields['kind'] in {'artist', 'organization'}:
        return register_maker(request, fields)
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
        products = user.products.select_related('product_type').prefetch_related('images', 'reviews__author', 'filters')
        payload['products'] = [
            {**product_payload(request, product), 'status': product.get_status_display()}
            for product in products
        ]
        payload['responses'] = account_responses(request, user)
    else:
        payload['tasks'] = account_tasks(request, user)
    payload['notices'] = consume_notices(user)
    return Response(payload)


WORK_CATEGORIES = ('Скульптура', 'Живопись', 'Декор', 'Мебель', 'Текстиль')

CATEGORY_SPHERE = {
    'Скульптура': ProductType.Sphere.SCULPTURE,
    'Живопись': ProductType.Sphere.FINE_ART,
    'Декор': ProductType.Sphere.DECORATION,
    'Мебель': ProductType.Sphere.FURNITURE_DESIGN,
    'Текстиль': ProductType.Sphere.TEXTILE,
}

SELLER_ROLES = {
    User.Role.MASTER,
    User.Role.DESIGNER,
    User.Role.ARCHITECT,
    User.Role.ORGANIZATION,
}

ACTIVE_RESPONSE_STATUSES = (TaskResponse.Status.PENDING, TaskResponse.Status.CHOSEN)


def read_money(raw):
    text = str(raw or '').strip().replace(' ', '').replace(',', '.')
    if not text:
        return None
    try:
        value = Decimal(text)
    except InvalidOperation:
        return None
    if value <= 0 or value >= Decimal('10000000000'):
        return None
    return value.quantize(Decimal('0.01'))


def clipped(raw, limit):
    return str(raw or '').strip()[:limit]


def collect_uploads(request, key, required, limit=8):
    files = [
        upload
        for upload in request.FILES.getlist(key)
        if getattr(upload, 'name', '') and getattr(upload, 'size', 0)
    ]
    if required and not files:
        return None, 'Добавьте хотя бы одну фотографию.'
    if len(files) > limit:
        return None, 'Слишком много фотографий.'
    for upload in files:
        problem = image_problem(upload)
        if problem:
            return None, 'Нужны фотографии.' if problem == 'missing' else problem
    return files, ''


def category_filter(name):
    item = CatalogFilter.objects.filter(kind=CatalogFilter.Kind.CATEGORY, name=name).first()
    if item is None:
        item = CatalogFilter.objects.create(kind=CatalogFilter.Kind.CATEGORY, name=name)
    return item


def product_type_for(category):
    sphere = CATEGORY_SPHERE[category]
    item = ProductType.objects.filter(sphere=sphere).first()
    if item is None:
        item = ProductType.objects.create(sphere=sphere)
    return item


def budget_label(task):
    prefix = 'до ' if task.budget_kind == Task.BudgetKind.UP_TO else ''
    return f'{prefix}{price_label(task.budget)}'


def response_images(request, item):
    return [
        request.build_absolute_uri(photo.image.url)
        for photo in item.images.all()
        if photo.image
    ]


def response_payload(request, item):
    return {
        'id': item.id,
        'task_id': item.task_id,
        'task_title': item.task.title,
        'price': str(item.price),
        'deadline': item.deadline,
        'message': item.message,
        'status': item.status,
        'status_label': item.get_status_display(),
        'artist_id': item.artist_id,
        'artist_name': person_name(item.artist),
        'images': response_images(request, item),
        'created_at': item.created_at.isoformat(),
    }


def task_images(request, task):
    return [
        request.build_absolute_uri(photo.image.url)
        for photo in task.images.all()
        if photo.image
    ]


def tasks_queryset():
    visible = Q(responses__status=TaskResponse.Status.PENDING) | Q(responses__status=TaskResponse.Status.CHOSEN)
    return (
        Task.objects.select_related('customer', 'assignee')
        .prefetch_related('images')
        .annotate(responses_count=Count('responses', filter=visible))
        .order_by('-created_at', '-id')
    )


def task_payload(request, task, user=None):
    data = {
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'category': task.category,
        'budget': str(task.budget),
        'budget_kind': task.budget_kind,
        'budget_label': budget_label(task),
        'deadline': task.deadline,
        'status': task.status,
        'status_label': task.get_status_display(),
        'customer_id': task.customer_id,
        'customer_name': person_name(task.customer),
        'assignee_id': task.assignee_id,
        'assignee_name': person_name(task.assignee) if task.assignee_id else '',
        'images': task_images(request, task),
        'responses_count': task.responses_count if hasattr(task, 'responses_count') else task.responses.exclude(status=TaskResponse.Status.REJECTED).count(),
        'created_at': task.created_at.isoformat(),
        'mine': bool(user and user.id == task.customer_id),
    }
    if data['mine']:
        replies = (
            task.responses.exclude(status=TaskResponse.Status.REJECTED)
            .select_related('artist', 'task')
            .prefetch_related('images')
        )
        data['responses'] = [response_payload(request, item) for item in replies]
    elif user is not None:
        own = (
            task.responses.filter(artist=user)
            .select_related('artist', 'task')
            .prefetch_related('images')
            .first()
        )
        if own is not None:
            data['my_response'] = response_payload(request, own)
    return data


def notify(user, text, href):
    Notice.objects.create(user=user, text=text[:300], href=href[:200])


def consume_notices(user):
    notices = list(user.notices.all()[:20])
    payload = [
        {
            'id': item.id,
            'text': item.text,
            'href': item.href,
            'read': item.read,
            'created_at': item.created_at.isoformat(),
        }
        for item in notices
    ]
    unread = [item.id for item in notices if not item.read]
    if unread:
        Notice.objects.filter(pk__in=unread).update(read=True)
    return payload


def account_responses(request, user):
    replies = (
        user.task_responses.filter(status__in=ACTIVE_RESPONSE_STATUSES)
        .select_related('artist', 'task')
        .prefetch_related('images')
        .order_by('-created_at', '-id')
    )
    return [response_payload(request, item) for item in replies]


def account_tasks(request, user):
    tasks = tasks_queryset().filter(customer=user)
    return [task_payload(request, task, user) for task in tasks]


def require_user(request):
    user = read_user(request)
    if user is None:
        return None, Response({'detail': 'Войдите в учётную запись.'}, status=401)
    return user, None


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def create_product(request):
    user, error = require_user(request)
    if error is not None:
        return error
    if user.role not in SELLER_ROLES:
        return Response({'detail': 'Товары выкладывают художники.'}, status=403)
    title = clipped(request.data.get('title'), 300).strip()
    description = clipped(request.data.get('description'), 8000).strip()
    category = str(request.data.get('category') or '').strip()
    price = read_money(request.data.get('price'))
    if not title:
        return Response({'detail': 'Укажите название.'}, status=400)
    if not description:
        return Response({'detail': 'Добавьте описание.'}, status=400)
    if category not in WORK_CATEGORIES:
        return Response({'detail': 'Выберите категорию.'}, status=400)
    if price is None:
        return Response({'detail': 'Укажите цену.'}, status=400)
    photos, photo_problem = collect_uploads(request, 'photos', required=True)
    if photo_problem:
        return Response({'detail': photo_problem}, status=400)
    with transaction.atomic():
        product = Product.objects.create(
            seller=user,
            product_type=product_type_for(category),
            title=title,
            description=description,
            price=price,
            quantity=1,
            status=Product.Status.PUBLISHED,
        )
        product.filters.add(category_filter(category))
        for order, photo in enumerate(photos):
            ProductImage.objects.create(
                product=product,
                image=photo,
                is_main=order == 0,
                sort_order=order,
            )
    product = (
        Product.objects.select_related('seller', 'product_type')
        .prefetch_related('images', 'reviews__author', 'filters')
        .get(pk=product.pk)
    )
    return Response(product_payload(request, product), status=201)


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def tasks(request):
    if request.method == 'GET':
        status = str(request.query_params.get('status') or '').strip()
        queryset = tasks_queryset()
        allowed = {item.value for item in Task.Status}
        if status:
            if status not in allowed:
                return Response({'detail': 'Неизвестный статус.'}, status=400)
            queryset = queryset.filter(status=status)
        user = read_user(request)
        return Response([task_payload(request, task, user) for task in queryset])
    user, error = require_user(request)
    if error is not None:
        return error
    if user.role != User.Role.CUSTOMER:
        return Response({'detail': 'Задачи создают заказчики.'}, status=403)
    title = clipped(request.data.get('title'), 300).strip()
    description = clipped(request.data.get('description'), 8000).strip()
    category = str(request.data.get('category') or '').strip()
    deadline = clipped(request.data.get('deadline'), 100).strip()
    budget = read_money(request.data.get('budget'))
    budget_kind = str(request.data.get('budget_kind') or Task.BudgetKind.FIXED).strip()
    if not title:
        return Response({'detail': 'Укажите название.'}, status=400)
    if not description:
        return Response({'detail': 'Опишите задачу.'}, status=400)
    if category not in WORK_CATEGORIES:
        return Response({'detail': 'Выберите категорию.'}, status=400)
    if not deadline:
        return Response({'detail': 'Укажите сроки.'}, status=400)
    if budget is None:
        return Response({'detail': 'Укажите бюджет.'}, status=400)
    if budget_kind not in {Task.BudgetKind.FIXED, Task.BudgetKind.UP_TO}:
        return Response({'detail': 'Выберите тип бюджета.'}, status=400)
    photos, photo_problem = collect_uploads(request, 'photos', required=False)
    if photo_problem:
        return Response({'detail': photo_problem}, status=400)
    with transaction.atomic():
        task = Task.objects.create(
            customer=user,
            title=title,
            description=description,
            category=category,
            budget=budget,
            budget_kind=budget_kind,
            deadline=deadline,
        )
        for order, photo in enumerate(photos):
            TaskImage.objects.create(task=task, image=photo, sort_order=order)
    task = tasks_queryset().get(pk=task.pk)
    return Response(task_payload(request, task, user), status=201)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def task_detail(request, task_id):
    task = get_object_or_404(tasks_queryset(), pk=task_id)
    return Response(task_payload(request, task, read_user(request)))


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def task_respond(request, task_id):
    user, error = require_user(request)
    if error is not None:
        return error
    if user.role not in SELLER_ROLES:
        return Response({'detail': 'Откликаться могут художники.'}, status=403)
    price = read_money(request.data.get('price'))
    deadline = clipped(request.data.get('deadline'), 100).strip()
    message = clipped(request.data.get('message'), 4000).strip()
    if price is None:
        return Response({'detail': 'Укажите цену.'}, status=400)
    if not deadline:
        return Response({'detail': 'Укажите сроки.'}, status=400)
    if not message:
        return Response({'detail': 'Напишите сообщение.'}, status=400)
    photos, photo_problem = collect_uploads(request, 'examples', required=False, limit=6)
    if photo_problem:
        return Response({'detail': photo_problem}, status=400)
    with transaction.atomic():
        task = Task.objects.select_for_update().filter(pk=task_id).first()
        if task is None:
            return Response({'detail': 'Задача не найдена.'}, status=404)
        if task.status != Task.Status.OPEN:
            return Response({'detail': 'Задача уже не принимает отклики.'}, status=400)
        if TaskResponse.objects.filter(task=task, artist=user).exists():
            return Response({'detail': 'Вы уже откликнулись на эту задачу.'}, status=400)
        item = TaskResponse.objects.create(
            task=task,
            artist=user,
            price=price,
            deadline=deadline,
            message=message,
        )
        for order, photo in enumerate(photos):
            TaskResponseImage.objects.create(response=item, image=photo, sort_order=order)
        notify(task.customer, f'Новый отклик на задачу «{task.title}»', f'/tasks/{task.id}')
    item = TaskResponse.objects.select_related('artist', 'task').prefetch_related('images').get(pk=item.pk)
    return Response(response_payload(request, item), status=201)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def task_choose(request, task_id):
    user, error = require_user(request)
    if error is not None:
        return error
    try:
        response_id = int(request.data.get('response_id'))
    except (TypeError, ValueError):
        return Response({'detail': 'Выберите отклик.'}, status=400)
    with transaction.atomic():
        task = Task.objects.select_for_update().filter(pk=task_id).first()
        if task is None:
            return Response({'detail': 'Задача не найдена.'}, status=404)
        if task.customer_id != user.id:
            return Response({'detail': 'Выбрать исполнителя может заказчик задачи.'}, status=403)
        if task.status != Task.Status.OPEN:
            return Response({'detail': 'Исполнитель уже выбран или задача закрыта.'}, status=400)
        chosen = (
            TaskResponse.objects.select_for_update()
            .filter(pk=response_id, task=task, status=TaskResponse.Status.PENDING)
            .select_related('artist')
            .first()
        )
        if chosen is None:
            return Response({'detail': 'Отклик не найден.'}, status=400)
        task.status = Task.Status.IN_PROGRESS
        task.assignee = chosen.artist
        task.save()
        chosen.status = TaskResponse.Status.CHOSEN
        chosen.save(update_fields=['status'])
        others = list(
            TaskResponse.objects.filter(task=task, status=TaskResponse.Status.PENDING)
            .exclude(pk=chosen.pk)
            .select_related('artist')
        )
        TaskResponse.objects.filter(pk__in=[item.pk for item in others]).update(status=TaskResponse.Status.REJECTED)
        notify(chosen.artist, f'Вас выбрали исполнителем задачи «{task.title}»', f'/tasks/{task.id}')
        for item in others:
            notify(item.artist, f'По задаче «{task.title}» выбран другой исполнитель', f'/tasks/{task.id}')
    task = tasks_queryset().get(pk=task.pk)
    return Response(task_payload(request, task, user))


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def task_close(request, task_id):
    user, error = require_user(request)
    if error is not None:
        return error
    with transaction.atomic():
        task = Task.objects.select_for_update().filter(pk=task_id).select_related('assignee').first()
        if task is None:
            return Response({'detail': 'Задача не найдена.'}, status=404)
        if task.customer_id != user.id:
            return Response({'detail': 'Закрыть задачу может её заказчик.'}, status=403)
        if task.status == Task.Status.CLOSED:
            return Response({'detail': 'Задача уже закрыта.'}, status=400)
        assignee = task.assignee
        pending = list(
            TaskResponse.objects.filter(task=task, status=TaskResponse.Status.PENDING).select_related('artist')
        )
        TaskResponse.objects.filter(pk__in=[item.pk for item in pending]).update(status=TaskResponse.Status.REJECTED)
        task.status = Task.Status.CLOSED
        task.save()
        if assignee is not None:
            notify(assignee, f'Заказчик закрыл задачу «{task.title}»', f'/tasks/{task.id}')
        for item in pending:
            if assignee is None or item.artist_id != assignee.id:
                notify(item.artist, f'Задача «{task.title}» закрыта', f'/tasks/{task.id}')
    task = tasks_queryset().get(pk=task.pk)
    return Response(task_payload(request, task, user))