docker:
	@docker build -t alextanhongpin/github-scraper .

up:
	@docker-compose up -d

down:
	@docker-compose down