from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from vacancy_analyzer.views import front, generate_text, get_areas, get_professional_roles, analyze_vacancy

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/generate-text/', generate_text, name='generate_text'),
    path('api/get_areas/', get_areas, name='get_areas'),
    path('api/get_professional_roles/', get_professional_roles, name='get_professional_roles'),
    path('api/analyze-vacancy/', analyze_vacancy, name='analyze_vacancy'),
    # Catch all other routes and serve the React app
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]