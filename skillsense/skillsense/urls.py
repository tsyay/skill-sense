from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from vacancy_analyzer.views import front, generate_text, get_areas, get_professional_roles, analyze_vacancy, extract_city, extract_professional_role, generate_text_about_skill

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/generate-text/', generate_text, name='generate_text'),
    path('api/get_areas/', get_areas, name='get_areas'),
    path('api/get_professional_roles/', get_professional_roles, name='get_professional_roles'),
    path('api/analyze-vacancy/', analyze_vacancy, name='analyze_vacancy'),
    path('api/extract-city/', extract_city, name='extract_city'),
    path('api/extract-professional-role/', extract_professional_role, name='extract_professional_role'),
    path('api/generate-text-about-skill/', generate_text_about_skill, name='generate_text_about_skill'),


    # Catch all other routes and serve the React app
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]