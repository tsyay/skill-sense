import requests
import os
from datetime import datetime, timedelta
from django.utils import timezone
from vacancy_analyzer.models import IamToken
from django.conf import settings

def get_iam_token():
    url = "https://iam.api.cloud.yandex.net/iam/v1/tokens"
    data = {
        "yandexPassportOauthToken": "y0__xDIgc_6AxjB3RMgjYKE8xLtvIfDVpumFjQIA3EdWGZlghwg8g" 
    }
    try:
        response = requests.post(url, json=data)
        response.raise_for_status() 
        response_data = response.json()
        
        token = response_data.get("iamToken")
        expires_in = response_data.get("expiresIn", 3600) 
        
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
        iam_token = IamToken.objects.latest('id')
        if iam_token.expiration_time > timezone.now() + timedelta(minutes=5):
            return iam_token.token
            
    except IamToken.DoesNotExist:
        pass
        
    return get_iam_token()
