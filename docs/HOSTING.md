[README.md](../README.md) • [LICENSE](../LICENSE)

# Hosting

## Table of Contents
<!-- TOC -->
* [Hosting](#hosting)
  * [Table of Contents](#table-of-contents)
  * [Prerequisites](#prerequisites)
    * [Before you begin](#before-you-begin)
    * [Getting started](#getting-started)
  * [Configuration](#configuration)
    * [.env](#env)
<!-- TOC -->

## Running QuizzyBot

### Before you begin

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en/) • We run QuizzyBot on Node v18.17, so we recommend you use that version or higher.
- [MongoDB](https://www.mongodb.com/) • We use a local MongoDB CE instance to host our database
- A Discord bot token • You can get one by creating a new application on
  the [Discord Developer Portal](https://discord.com/developers/applications)

### Getting started

```shell
# Clone the repository
git clone https://github.com/beauthebear/quizzy-bot.git
cd quizzy-bot

# Install dependencies
npm install

# Fill out the .env file
cp .env.example .env
nano .env # or your favorite text editor

# Start the bot
npm start
```

## Configuration

### .env

| Key       | Description                                       | Default                     |
|-----------|---------------------------------------------------|-----------------------------|
| TOKEN     | The Discord bot token                             | `null`                      |
| DEV_TOKEN | The Discord bot token for the development bot,    | `null`                      |
| CLIENT_ID | The Discord bot client ID                         | `null`                      |
| DEV_ID    | The Discord bot client ID for the development bot | `null`                      |
| DEV_MODE  | Whether or not to run the development bot         | `false`                     |
| MONGO_URL | The MongoDB connection URL                        | `mongodb://127.0.0.1:27017` |
| MONGO_DB  | The MongoDB database name                         | `bot_db`                    |
| BOT_NAME  | The name of the bot. *This is not yet used*       | `QuizzyBot`                 |