from django.db import models

class Vacancy(models.Model):
    title = models.CharField("Title", max_length=240)
    company = models.CharField("Company", max_length=240)
    description = models.TextField("Description")
    requirements = models.TextField("Requirements")
    salary_min = models.DecimalField("Minimum Salary", max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField("Maximum Salary", max_digits=10, decimal_places=2, null=True, blank=True)
    location = models.CharField("Location", max_length=240)
    employment_type = models.CharField("Employment Type", max_length=50)
    posted_date = models.DateField("Posted Date", auto_now_add=True)
    url = models.URLField("Vacancy URL", max_length=512)
    
    def __str__(self):
        return f"{self.title} at {self.company}"

class IamToken(models.Model):
    token = models.CharField(max_length=255)
    expiration_time = models.DateTimeField()

    def __str__(self):
        return self.token