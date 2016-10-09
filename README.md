# vindinium-ai

Bot that plays [vindinium](http://vindinium.org/). It’s shit though. It has bugs, lacks proper tests, ranking is badly balanced and in general the bot doesn’t win often.

## General description

Every round the bot generates all possible strategies, e.g. kill another player, take a mine, regenerate health. It ranks them and picks the best. As long as there is no better strategy, the bot follows it. If there appears a better opportunity (e.g. standing next to a tavern when the bot is low on health), it will be followed instead, but old strategy is not forgotten. When the goal is achieved (e.g. player died, mine is owned, health is up), the bot checks if the other strategies are still current (e.g. were planned less than N rounds ago). If so, follows the next available strategy or throws them away and picks a completely new one.

**What works well**

* Pathfinding
* Stack of strategies

**What doesn’t**

* Ranking of strategies
* Detection of loops in game
* Fighting

## Running

First [register](http://vindinium.org/register) for a key and put it into a `config.json`. Then run:

    npm i
    node bot.js -a 1 config.json
