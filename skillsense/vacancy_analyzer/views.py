from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services.yandex_gpt import YandexGPT
from .services.hh_api import HHAPI
import json

# Create your views here.
def front(request):
    context = { }
    return render(request, "index.html", context)


@csrf_exempt  # Для упрощения (в продакшене используйте аутентификацию!)
def generate_text(request):
    if request.method == "POST":
        prompt = request.POST.get("prompt")
        gpt = YandexGPT()
        result = gpt.generate_text(prompt)
        return JsonResponse({"response": result})
    return JsonResponse({"error": "Only POST allowed"}, status=400)

def get_areas(request):
    hh = HHAPI()
    areas = hh.get_areas()
    return JsonResponse({"areas": areas})

def get_professional_roles(request):
    hh = HHAPI()
    professional_roles = hh.get_professional_roles()
    return JsonResponse({"professional_roles": professional_roles})

@csrf_exempt
def analyze_vacancy(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt')
            
            if not prompt:
                return JsonResponse({'error': 'No prompt provided'}, status=400)
            
            gpt = YandexGPT()
            result = gpt.generate_text(prompt)
            
            return JsonResponse(result, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
