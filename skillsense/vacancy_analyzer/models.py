from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator

class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[MinLengthValidator(3)],
        help_text='Обязательно. 3-150 символов.'
    )
    password = models.CharField(
        max_length=128,
        validators=[MinLengthValidator(8)],
        help_text='Обязательно. Минимум 8 символов.'
    )
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add related_name to resolve conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='vacancy_analyzer_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='vacancy_analyzer_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

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
