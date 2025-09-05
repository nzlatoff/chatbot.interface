all: format

install:
	npm install

format:
	npx @biomejs/biome format --write

start:
	npm run start

dev:
	npm run devstart