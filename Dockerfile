FROM node:22-alpine3.19

WORKDIR /container2

COPY . .

RUN npm install

EXPOSE 6002

CMD ["node", "index.js"]
