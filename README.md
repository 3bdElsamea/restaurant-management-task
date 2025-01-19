## Description

This repository contains the solution for a very simple ** Restaurant Management System** developed using **NestJS**, *
*MongoDB**, and **Redis**. The system provides functionalities for managing restaurant orders and generating reports,
including a feature to generate daily sales reports.

## Project setup

### Cloning the repository

- First, clone the repository to your local machine:

```bash
  git clone https://github.com/3bdElsamea/restaurant-management-task.git
````

- Then, navigate to the project directory:

```bash
  cd restaurant-management-task
```

- then we move to the next step ...

### Handling Environment Variables

To get started, create a `.env` file at the root of the project and define the following environment variables:

```plaintext
PORT=               # Port number for the server to run on
MONGO_URI=          # MongoDB connection string
REDIS_HOST=         # Redis host IP address
REDIS_PASSWORD=     # Password for the Redis server
REDIS_PORT=         # Redis port number
REDIS_DB=           # Redis database number
```

you can use the `.env.example` file as a template.

### Installing Dependencies

```bash
$ npm install
```

## Compile and run the project

#### development mode

```bash
$ npm run start
```

#### watch mode

```bash
$ npm run start:dev
```

#### production mode

```bash
$ npm run start:prod
```

# API Documentation

The API endpoints and their usage are documented in a Postman Collection. You can access it using the link below:

[View API Documentation on Postman](https://documenter.getpostman.com/view/25931255/2sAYQanXhu)
