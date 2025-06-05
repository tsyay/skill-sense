import requests
import os
from datetime import datetime, timedelta
from django.utils import timezone
from vacancy_analyzer.models import IamToken
from django.conf import settings

def get_iam_token():
    url = "https://iam.api.cloud.yandex.net/iam/v1/tokens"
        
    data = {
        "yandexPassportOauthToken": "y0__xDIgc_6AxjB3RMgjYKE8xLtvIfDVpumFjQIA3EdWGZlghwg8g"  # Замените на ваш OAuth-токен
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()  # Raise an exception for bad status codes
        response_data = response.json()
        
        token = response_data.get("iamToken")
        expires_in = response_data.get("expiresIn", 3600)  # Default to 1 hour if not specified
        
        if not token:
            raise ValueError("No IAM token in response")
            
        expiration_time = timezone.now() + timedelta(seconds=expires_in)
        
        # Create new token record
        IamToken.objects.create(token=token, expiration_time=expiration_time)
        return token
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to get IAM token: {str(e)}")
    except ValueError as e:
        raise Exception(f"Invalid response format: {str(e)}")

def update_iam_token():
    try:
        # Try to get the latest token
        iam_token = IamToken.objects.latest('id')
        
        # Check if token is still valid (with 5-minute buffer)
        if iam_token.expiration_time > timezone.now() + timedelta(minutes=5):
            return iam_token.token
            
    except IamToken.DoesNotExist:
        pass
        
    # If we get here, we need a new token
    return get_iam_token()
