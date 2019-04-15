FROM keymetrics/pm2:latest-alpine

RUN npm i -g pm2

WORKDIR /var/www/app
COPY ./ ./
RUN npm i

ENV NODE_ENV production 
ENV PORT 3000

EXPOSE 3000

CMD ["pm2-runtime", "start.js", "i", "2"]
