import requests


class HHAPI:
    def __init__(self):
        self.base_url = "https://api.hh.ru"
        self.headers = {
            "HH-User-Agent": "SkillSense/1.0 (tsyay.workmail@gmail.com)",
            "Content-Type": "application/json"
        }

    def get_vacancies(self, query):
        url = f"{self.base_url}/vacancies"
        params = {
            "text": query,
            "per_page": 100,
            "page": 0
        }
        response = requests.get(url, params=params, headers=self.headers)
        return response.json()  

    def get_areas(self):
        url = f"{self.base_url}/areas"
        response = requests.get(url, headers=self.headers)
        return response.json()

    def get_professional_roles(self, text="пр"):
        """
        Get professional roles suggestions from HH API.
        
        Args:
            text (str): Search text (must be at least 2 characters long).
                       Default is "пр" (short for "профессия" - profession in Russian)
        
        Returns:
            dict: API response with professional roles suggestions
        """
        if len(text) < 2:
            text = "пр"  # Fallback to default if text is too short
        url = f"{self.base_url}/suggests/professional_roles"
        params = {"text": text}
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()






