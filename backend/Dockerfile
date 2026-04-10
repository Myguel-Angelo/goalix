FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --upgrade pip

FROM base AS development
COPY requirements/base.txt requirements/local.txt ./requirements/
RUN pip install -r requirements/local.txt
COPY . .

FROM base AS production
COPY requirements/base.txt requirements/production.txt ./requirements/
RUN pip install -r requirements/production.txt
COPY . .

RUN python manage.py collectstatic --noinput