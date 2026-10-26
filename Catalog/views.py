from django.db.models import Case, IntegerField, Prefetch, Q, Value, When
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Conversation, Portfolio, Product, User
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


def read_user(request):
    try:
        user_id = int(request.headers.get('X-User', ''))
    except (TypeError, ValueError):
        return None
    return User.objects.filter(pk=user_id).first()


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