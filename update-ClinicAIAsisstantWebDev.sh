#! /bin/bash
git pull origin develop


docker ps -a  --format "{{.ID}} {{.Names}}" | grep -E clinic-ai-assistant-web-dev-image | awk '{print $1}' | xargs -r docker stop
docker ps -a  --format "{{.ID}} {{.Names}}" | grep -E clinic-ai-assistant-web-dev-image | awk '{print $1}' | xargs -r docker rm

# 服务
# docker rmi -f  clinic-ai-assistant-web-dev-image

# 以下是测试服地址，正式部署需改
docker build  -f ./Dockerfile \
              --build-arg VITE_API_ACCOUNT_BASE_URL=https://api-test.zhilanmed.com/hs-account \
              --build-arg VITE_API_BUSINESS_BASE_URL=https://api-test.zhilanmed.com/clinic-assist \
              --build-arg VITE_EVENT_SOURCE_BASE_URL=https://api-test.zhilanmed.com/api/clinic-message  \
              --build-arg VITE_API_LOCALSERVER_BASE_URL=http://127.0.0.1:9000 \
              -t clinic-ai-assistant-web-dev-image . 

docker stop clinic-ai-assistant-web-dev-image
docker rm clinic-ai-assistant-web-dev-image

#启动服务
docker run -d -p 8090:80 --name clinic-ai-assistant-web-dev-image clinic-ai-assistant-web-dev-image
