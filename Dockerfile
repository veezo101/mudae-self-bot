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
RUN echo "45 * * * * cd /usr/src/app && /usr/local/bin/npm start >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Create log file
RUN touch /var/log/cron.log

# Start cron and keep container running
CMD crond -f -l 8