from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services.yandex_gpt import YandexGPT
from .services.hh_api import HHAPI
import json
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

# Create your views here.
def front(request):
    context = { }
    return render(request, "index.html", context)


@csrf_exempt
def generate_text(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            prompt = data.get('prompt')
            query = data.get('query')
            
            if not query:
                return JsonResponse({"error": "No query provided"}, status=400)
            
            gpt = YandexGPT()
            result = gpt.generate_text(f"{prompt}\n\nТекст: {query}")
            
            # Extract city from the result
            city = result.strip()
            return JsonResponse({"city": city})
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
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

@csrf_exempt
def extract_city(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            query = data.get('query')
            
            if not query:
                return JsonResponse({"error": "No query provided"}, status=400)
            
            gpt = YandexGPT()
            result = gpt.extract_city(f"Извлеки название города или региона из текста. Верни только название города, без дополнительных слов.\n\nТекст: {query}")
            
            return JsonResponse({"city": result.strip()})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Only POST allowed"}, status=400)

@csrf_exempt
def extract_professional_role(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            query = data.get('query')
            
            if not query:
                return JsonResponse({"error": "No query provided"}, status=400)
            
            gpt = YandexGPT()
            result = gpt.extract_professional_role(f"Извлеки название профессии или должности из текста. Верни только название профессии, без дополнительных слов.\n\nТекст: {query}")
            
            return JsonResponse({"role": result.strip()})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Only POST allowed"}, status=400)

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class UserLoginView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserLoginSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
