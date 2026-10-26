from django.db.models import Case, IntegerField, Prefetch, Value, When
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Portfolio, Product, User
from .serializers import ProductSerializer


@api_view(['GET'])
def catalog(request):
    products = (
        Product.objects.filter(status=Product.Status.PUBLISHED)
        .select_related('seller', 'product_type')
        .prefetch_related('images')
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
    return {
        'id': product.id,
        'title': product.title,
        'description': product.description,
        'price': str(product.price),
        'image': product_image(request, product),
        'sphere': product.product_type.get_sphere_display() if product.product_type_id else '',
        'production_time': product.production_time,
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
        .prefetch_related('images')
    )
    profile['portfolios'] = [work_payload(request, work) for work in portfolios]
    profile['products'] = [product_payload(request, product) for product in products]
    return Response(profile)