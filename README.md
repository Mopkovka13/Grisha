docker build -t grinya . && docker run -p 8080:8080 -v grinya_data:/app/data -v grinya_media:/app/media grinya
