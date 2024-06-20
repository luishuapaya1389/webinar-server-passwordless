FROM node:current-alpine3.20
#ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
#RUN npm install --production --silent && mv node_modules ../
RUN npm install && mv node_modules ../
COPY . .
EXPOSE 3003
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]