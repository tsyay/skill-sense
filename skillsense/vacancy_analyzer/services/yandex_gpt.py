from yandexcloud import SDK
from vacancy_analyzer.utils import update_iam_token
import requests
import re

URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
iam_token = update_iam_token()
folder_id = "b1gjcdinq5kr5gc6c1ad"   

class YandexGPT:
    def generate_text(self, prompt):
        system_prompt = (
            "Ты парень, который занимается анализом вакансий и подбирает для них соответствующие навыки. "
            "Я передаю тебе требования, которые актуальны в конкретом регионе, сформируй эти требования под нужный формат"
            "Верни данные в формате JSON: "
            '{"soft_skills": [{"name": "Название навыка", "description": "Описание навыка", "how_to_learn": "Краткое описание как освоить"}], "hard_skills": [{"name": "Название навыка", "description": "Описание навыка", "how_to_learn": "Краткое описание как освоить"}]}'
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

    def extract_city(self, prompt):
        system_prompt = (
                "Ты - помощник по извлечению названий городов из текста. "
                "Твоя задача - найти и вернуть только название города или региона из текста. "
                "Если в тексте нет города, верни пустую строку. "
                "Возвращай строго только название города, без дополнительных слов и вообще без сиволов."
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

    def extract_professional_role(self, prompt):
        
        system_prompt_for_extract_professional_role = (
            "Ты — помощник по извлечению названий профессий из текста. "
            "Твоя задача — найти и вернуть только название профессии. "
            "Игнорируй города, регионы и другие дополнительные слова. "
            "Примеры: "
            "- Из 'Продавец в Улан-Удэ' → 'Продавец' "
            "- Из 'Разработчик Python в Москве' → 'Разработчик' "
            "- Из 'Менеджер по продажам' → 'Менеджер по продажам' "
            "Верни только название профессии, без кавычек и точек."
        )

        data_for_extract_professional_role = {
            "modelUri": f"gpt://{folder_id}/yandexgpt",
            "completionOptions": {"temperature": 0.3, "maxTokens": 1000},
            "messages": [
                {
                    "role": "system",
                    "text": system_prompt_for_extract_professional_role
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
            json=data_for_extract_professional_role,
        ).json()

        # Очищаем ответ от возможных JSON-структур и форматирования
        role = response['result']['alternatives'][0]['message']['text']
        # Удаляем все, что похоже на JSON
        role = role.split('{')[0].split('}')[0].split('[')[0].split(']')[0]
        # Удаляем обратные кавычки, невидимые символы и лишние пробелы
        role = re.sub(r'[\u200B-\u200D\uFEFF]', '', role)  # Удаляем невидимые символы
        role = role.replace('`', '').strip()  # Удаляем обратные кавычки и пробелы
        
        return role

    def generate_text_about_skill(self, prompt):
        system_prompt = (
                "Ты парень, который занимается анализом вакансий и подбирает для них соответствующие навыки. "
                "Твоя задача - найти более подробное описание для этого навыка"
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
