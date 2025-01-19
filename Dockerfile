FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Default port if not overridden by ENV or build argument
ARG PORT=3000
ENV PORT=$PORT

EXPOSE $PORT

CMD ["npm", "run", "start"]