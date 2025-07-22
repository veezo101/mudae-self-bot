FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Add crontab file
RUN echo "55 * * * * cd /usr/src/app && npm start" > /etc/crontabs/root

# Create log file
RUN touch /var/log/cron.log

# Start cron and keep container running
CMD crond -f -l 5 -d 8