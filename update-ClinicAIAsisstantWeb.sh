#! /bin/bash
git pull origin release/0.6.0


docker ps -a  --format "{{.ID}} {{.Names}}" | grep -E clinic-ai-assistant-web-image | awk '{print $1}' | xargs -r docker stop
docker ps -a  --format "{{.ID}} {{.Names}}" | grep -E clinic-ai-assistant-web-image | awk '{print $1}' | xargs -r docker rm

# 服务
# docker rmi -f  clinic-ai-assistant-web-image

# 正式部署

docker build -f ./Dockerfile \
    --build-arg VITE_APP_BASE_PATH=/offlineasr/ \
    --build-arg VITE_API_ACCOUNT_BASE_URL=https://ai-doctor-assistant.zhilanmed.com/api/hsaccount \
    --build-arg VITE_API_BUSINESS_BASE_URL=https://ai-doctor-assistant.zhilanmed.com/api/clinic \
    --build-arg VITE_EVENT_SOURCE_BASE_URL=https://ai-doctor-assistant.zhilanmed.com/api/clinic-message \
    --build-arg VITE_API_LOCALSERVER_BASE_URL=http://127.0.0.1:9000 \
    -t clinic-ai-assistant-web-image .

docker run -d -p 8081:80 --name clinic-ai-assistant-web-image clinic-ai-assistant-web-image
