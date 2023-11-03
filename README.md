
[HOSTING.md](HOSTING.md) • [LICENSE](LICENSE)

# QuizzyBot

> Your Discord quiz master.

## Table of Contents

<!-- TOC -->
* [QuizzyBot](#quizzybot)
  * [Table of Contents](#table-of-contents)
  * [Overview](#overview)
  * [Getting Started](#getting-started)
  * [Features](#features)
    * [Commands](#commands)
    * [Random Quiz](#random-quiz)
    * [Categories](#categories)
  * [Technologies](#technologies)
  * [License](#license)
<!-- TOC -->

## Overview

QuizzyBot is a Discord bot created for the 2023 Discord DDevs Buildathon. It's designed to enhance your Discord server
by adding an engaging and educational element. With QuizzyBot, you can easily host quizzes and trivia games on various
subjects, making learning fun and interactive for your server members. Whether you're a server owner looking to boost
engagement or a user seeking a fun way to acquire knowledge, QuizzyBot is here to facilitate the learning experience.
Get ready to challenge your friends, test your knowledge, and have a blast with QuizzyBot!

QuizzyBot sources questions from the [**Open Trivia DB**](https://opentdb.com/)

## Getting Started

If you'd like to host QuizzyBot, please see [HOSTING.md](HOSTING.md) for instructions.
Otherwise, you can add QuizzyBot to your server by
clicking [here](https://discord.com/api/oauth2/authorize?client_id=1168686016866041916&permissions=2048&scope=bot).

## Features

### Commands

- `[]` - optional argument
- `<>` - required argument


- **/quiz** `[topic]` `[difficulty]` `[numQuestions]`

  Host a quiz on a topic of your choice. Asks `numQuestions` questions of `difficulty` on `topic`.
  At the end of the quiz, the bot will display the score of each participant and announce the winner who will receive
  a point multiplier of 1.5x.

- **/randomQuestion** `[topic]` `[difficulty]`

  Get a random question on a topic of your choice. You receive 1 point for correctly answering an easy question, 2
  points for a medium question, and 5 points for a hard question.

### Random Quiz

QuizzyBot will randomly send a question to a pre-defined channel every hour (or whatever interval you choose). The
question will be on a random topic and difficulty. The first person to answer correctly will receive 1.5x the points
of the difficulty of the question. For example, if the question is hard, the first person to answer correctly will
receive 5 x 1.5 = 7.5 points, *but* rounded up to 8 points.

### Categories

- **General Knowledge**
- **Entertainment**
    - Books
    - Film
    - Music
    - Musicals & Theatres
    - Television
    - Video Games
    - Board Games
    - Anime & Manga
    - Cartoons & Animations
- **Science**
    - Nature
    - Computers
    - Mathematics
    - Gadgets
- **Mythology**
- **Sports**
- **Geography**
    - History
    - Politics
- **Art**
- **Celebrities**
- **Animals**
- **Vehicles**
- **Sports**

## Attributions

- [**Node.js**](https://nodejs.org/en/)
- [**Discord.js**](https://discord.js.org/#/)
- [**Open Trivia DB**](https://opentdb.com/)
- [**MongoDB**](https://www.mongodb.com/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


