from django.contrib import admin
from django.urls import path
from vacancy_analyzer.views import front
from vacancy_analyzer.views import generate_text
from vacancy_analyzer.views import get_areas
from vacancy_analyzer.views import get_professional_roles
urlpatterns = [
    path('admin/', admin.site.urls),
    path("", front, name="front"),
    path('generate-text/', generate_text, name='generate_text'),
    path('get_areas/', get_areas, name='get_areas'),
    path('get_professional_roles/', get_professional_roles, name='get_professional_roles'),
]