From node

ADD . /app
RUN cd /app && npm install
WORKDIR /app

CMD ["npm", "start"]


