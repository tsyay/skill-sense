from yandexcloud import SDK
from vacancy_analyzer.utils import update_iam_token
import requests

URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
iam_token = update_iam_token()
folder_id = "b1gjcdinq5kr5gc6c1ad"   # ID каталога в Yandex Cloud

class YandexGPT:
    def generate_text(self, prompt):
        data = {
            "modelUri": f"gpt://{folder_id}/yandexgpt",
            "completionOptions": {"temperature": 0.3, "maxTokens": 1000},
            "messages": [
                {
                    "role": "system",
                    "text": "Ты парень, который занимается анализом вакансий и подбирает для них соответствующие навыки. Ты должен ответить на вопрос, какие навыки наиболее подходят для данной вакансии."
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
