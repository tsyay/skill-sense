from yandexcloud import SDK
import requests

URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
iam_token = "t1.9euelZrJz42bysbJzYuOjM-bzpKJje3rnpWazpiblYyPk5eXiY2cicmWlMbl8_cGSD4_-e9ZWC85_t3z90Z2Oz_571lYLzn-zef1656VmpSYlJiPkJrGk42ckZ6cxpWV7_zF656VmpSYlJiPkJrGk42ckZ6cxpWV.nhOiSRIYh6g_D4ie8j8GColw8GFJjPpC54gx10EjfjSMJzyyQfwkGR1-_VWPQ27YnCbF2TJVpmNeWTTfPUvyCg" # Или храните в settings.py
folder_id = "b1gjcdinq5kr5gc6c1ad"   # ID каталога в Yandex Cloud

class YandexGPT:
    def generate_text(self, prompt):
        data = {}

        prompt = "Вакансия: Менеджер Telegram/WhatsApp"

        data["modelUri"] = f"gpt://{folder_id}/yandexgpt"

        data["completionOptions"] = {"temperature": 0.3, "maxTokens": 1000}

        data["messages"] = [
            {"role": "system", "text": "Ты парень, который занимается анализом вакансий и подбирает для них соответствующие навыки. Ты должен ответить на вопрос, какие навыки наиболее подходят для данной вакансии."},
            {"role": "user", "text": f"{prompt}"},
        ]
        response = requests.post(
        URL,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {iam_token}"
        },
        json=data,
        ).json()
        return response['result']['alternatives'][0]['message']['text']
