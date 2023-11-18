[README.md](../README.md) • [LICENSE](../LICENSE)

# Hosting

## Table of Contents

<!-- TOC -->

* [Hosting](#hosting)
    * [Table of Contents](#table-of-contents)
    * [Running QuizzyBot](#running-quizzybot)
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

# Fill out the config.json file
cp config.example.json config.json
nano config.json # or your favorite text editor

# Start the bot
npm start
```

## Configuration

We have both a `.env` file and a `config.json` file. The `.env` file is used for sensitive information,
such as the bot token, while the `config.json` file is used for information that is not sensitive, such as
the bot name, links, etc.

- [.env](#env)
- [config.json](#configjson)

### .env

| Key           | Description                                       | Default                     |
|---------------|---------------------------------------------------|-----------------------------|
| TOKEN         | The Discord bot token                             | `null`                      |
| DEV_TOKEN     | The Discord bot token for the development bot,    | `null`                      |
| ~~CLIENT_ID~~ | The Discord bot client ID                         | `null`                      |
| ~~DEV_ID~~    | The Discord bot client ID for the development bot | `null`                      |
| DEV_MODE      | Whether or not to run the development bot         | `false`                     |
| MONGO_URL     | The MongoDB connection URL                        | `mongodb://127.0.0.1:27017` |
| MONGO_DB      | The MongoDB database name                         | `bot_db`                    |
| ~~BOT_NAME~~  | The name of the bot. *This is not yet used*       | `QuizzyBot`                 |

* ~~Crossed out~~ keys have been moved to the `config.json` file.

### config.json

| Key               | Description                                                   | Default                                     |
|-------------------|---------------------------------------------------------------|---------------------------------------------|
| **bot**           | Category for bot-related configuration.                       |                                             |
| bot.name          | The name of the bot                                           | `QuizzyBot`                                 |
| bot.developerId   | The Discord ID of the bot developer.                          | `null`                                      |
| bot.description   | The description of the bot.                                   | `A bot that quizzes you on various topics!` |
| **links**         | Category for links.                                           |                                             |
| links.devGithub   | The link to the developer's GitHub profile.                   | `null`                                      |
| links.botGithub   | The link to the bot's GitHub repository.                      | `null`                                      |
| links.invite      | The link to invite the bot to your server.                    | `null`                                      |
| links.support     | The link to the support server.                               | `null`                                      |
| **emojis**        | Category for emojis. See example emojis in `/assets/emojis/`. |                                             |
| emojis.category   | The emoji to use for the category.                            | `null`                                      |
| emojis.difficulty | The emoji to use for the difficulty.                          | `null`                                      |
| emojis.github     | The emoji to use for the GitHub link.                         | `null`                                      |
| emojis.discord    | The emoji to use for the Discord link.                        | `null`                                      |
| emojis.discordjs  | The emoji to use for the Discord.js link.                     | `null`                                      |