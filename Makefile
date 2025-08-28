all: format

install:
	npm install

format:
	npx @biomejs/biome format --write

dev:
	npm run devstart