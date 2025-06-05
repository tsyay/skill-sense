from django.urls import path
from .api.yandex_gpt_api import generate_text
from . import views

urlpatterns = [
    path('api/yandex-gpt/generate/', generate_text, name='yandex-gpt-generate'),
    path('api/analyze/', views.analyze_vacancy, name='analyze_vacancy'),
    path('api/professional-roles/', views.get_professional_roles, name='get_professional_roles'),
    path('api/yandex-cloud/clouds/', views.list_clouds, name='list_clouds'),
    path('api/yandex-cloud/clouds/<str:cloud_id>/', views.get_cloud, name='get_cloud'),
] 