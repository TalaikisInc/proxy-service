FROM keymetrics/pm2:latest-alpine

RUN npm i -g pm2

WORKDIR /var/www/app
COPY ./package.json ./
RUN npm i
COPY ./ ./

ENV NODE_ENV production 
ENV PORT 3000

EXPOSE 3000

CMD ["pm2-runtime", "src/index.js", "i", "2"]
