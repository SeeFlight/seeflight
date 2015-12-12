# Prerequesite
* Install Git
* Install NodeJS
* Install MongoDB

# Installation
* Clone the repository
    git clone https://github.com/SeeFlight/seeflight.git
* Go in the directory created and download and install the node packages
    cd /directory-created-by-git
    npm install

# Environment configuration

The project is waiting for an environment variable when running called ENV. Two keys are available :
* "dev" for development environment
* "prod" for production environment

# Running application
The application is written in NodeJS, to run it :
* In development mode
    ENV='dev' node app.js
* In production mode
    ENV='prod' node app.js
    
The application is running on the port 8282 in development, 9292 in production
