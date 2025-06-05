from celery.schedules import crontab
from celery.task import periodic_task
from vacancy_analyzer.utils import update_iam_token

@periodic_task(run_every=crontab(minute="*/5"))  # Каждые 5 минут
def update_iam_token_task():
    update_iam_token()
