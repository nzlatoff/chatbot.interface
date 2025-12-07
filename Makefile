all: install format

install:
	npm install

format:
	npx @biomejs/biome format --write

start:
	docker compose build
	docker compose up -d app

update:
	docker compose down
	git pull
	docker compose build
	docker compose up -d app

dev:
	npm run devstart