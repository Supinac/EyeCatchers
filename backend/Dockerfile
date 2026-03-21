FROM python:3.13

WORKDIR /application

RUN apt-get update \
	&& apt-get install -y --no-install-recommends fonts-dejavu-core \
	&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt /application
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /application/app


ENTRYPOINT ["fastapi", "run", "app/main.py", "--port", "80"]
CMD []

EXPOSE 80