FROM mhart/alpine-node:10.1.0

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production

FROM mhart/alpine-node:base-10.1.0
WORKDIR /app
COPY --from=0 /app .
COPY ./dist .
RUN mkdir db
EXPOSE 5000
CMD ["node", "index.js"]