from yandexcloud import SDK
from vacancy_analyzer.utils import update_iam_token
import requests

URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
iam_token = update_iam_token()
folder_id = "b1gjcdinq5kr5gc6c1ad"   

class YandexGPT:
    def generate_text(self, prompt):
        # Check if this is a city extraction request
        is_city_extraction = "извлечь регион/город из текста" in prompt
        
        system_prompt = (
            "Ты парень, который занимается анализом вакансий и подбирает для них соответствующие навыки. "
            "Ты должен ответить на вопрос, какие навыки наиболее подходят для данной вакансии."
        )
        
        if is_city_extraction:
            system_prompt = (
                "Ты - помощник по извлечению названий городов из текста. "
                "Твоя задача - найти и вернуть только название города или региона из текста. "
                "Если в тексте нет города, верни пустую строку. "
                "Возвращай только название города, без дополнительных слов."
            )
        
        data = {
            "modelUri": f"gpt://{folder_id}/yandexgpt",
            "completionOptions": {"temperature": 0.3, "maxTokens": 1000},
            "messages": [
                {
                    "role": "system",
                    "text": system_prompt
                },
                {"role": "user", "text": prompt}
            ]
        }

        response = requests.post(
            URL,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {iam_token}"
            },
            json=data,
        ).json()

        return response['result']['alternatives'][0]['message']['text']
