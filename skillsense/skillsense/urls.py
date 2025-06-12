from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from vacancy_analyzer.views import generate_text, get_areas, get_professional_roles, analyze_vacancy, extract_city, extract_professional_role

urlpatterns = [
    # API routes
    path('api/generate-text/', generate_text, name='generate_text'),
    path('api/get_areas/', get_areas, name='get_areas'),
    path('api/get_professional_roles/', get_professional_roles, name='get_professional_roles'),
    path('api/analyze-vacancy/', analyze_vacancy, name='analyze_vacancy'),
    path('api/extract-city/', extract_city, name='extract_city'),
    path('api/extract-professional-role/', extract_professional_role, name='extract_professional_role'),
    
    # Authentication routes
    path('', include('vacancy_analyzer.urls')),
    
    # Admin routes
    path('admin/', admin.site.urls),
    
    # Frontend route - must be last
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)