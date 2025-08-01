# Discord Welcome/Bye - Bot (v13 / v14)

## Project Description

This is a Discord bot that generates screenshots with a welcome or goodbye message (with the user's avatar and a custom background image) when a user joins or leaves the server. The bot uses the **Puppeteer** library to generate screenshots and sends them as embeds to the designated welcome or goodbye channel on the server.

**Features:**
- Generate screenshots with user avatars and personalized background.
- Send welcome and goodbye messages to a designated channel.
- Automatically delete the image file after sending the message.

## Requirements

- Node.js (v16.x or higher)
- **discord.js** v13 / v14
- **puppeteer** for screenshot generation
- A Discord bot with appropriate permissions

## Example Usage

### Events:

- **guildMemberAdd** – The bot sends a welcome message to the channel.
- **guildMemberRemove** – The bot sends a goodbye message to the channel.

Both messages include:
- **User's avatar** in the generated image.
- **Personalized text**: "Welcome" for new users and "Bye" for users leaving.

### Generated Image Structure:

The bot creates an image with a welcome or goodbye message where:
- The **avatar** of the user is in the center.
- The **user's name (nickname)** and message type ("Welcome" or "Bye") are displayed.

### Example Message:

The bot generates and sends a message to the channel with the following embed and image:

**Welcome:**
- `Welcome, [nickname] to our server!`

**Goodbye:**
- `Goodbye, [nickname]. We hope you return!`

---

## Project Structure

/discord-welcome-bye-bot
│  
├── /images # Folder storing temporary screenshot files  
├── index.js # Main bot file  
├── package.json # Project dependencies  
└── README.md # Project documentation

---

# Configuration Guide for Welcome/Goodbye Bot

## Background Image Size
- The background image used for screenshots is recommended to be **1100x500 px** for best display results.
- The current example image is exactly this size.
- Changing this size or the image might require tweaking the CSS styles and testing to ensure the screenshot looks correct.

## Available Template Variables
You can use the following placeholders in your embed titles, descriptions, footers, and screenshot text fields. These will be dynamically replaced with actual data:

| Variable      | Description                                      |
|---------------|------------------------------------------------|
| `[username]`  | Discord username (without tag).                  |
| `[userId]`    | Discord user ID.                                 |
| `[userTag]`   | Full Discord username with discriminator (e.g., User#1234). |
| `[userMention]` | Mention of the user (`<@userId>`) that pings them in chat. |
| `[guildName]` | Name of the Discord server.                      |
| `[memberCount]` | Current number of members on the server.       |

## Debug Mode
- When `"debugMode"` is enabled (`true`), the bot listens for two special commands to test welcome/goodbye messages without real member events:
  - `!debug-join <userId>` — simulates a user join event for the specified user ID.
  - `!debug-leave <userId>` — simulates a user leave event for the specified user ID.
- These commands only work for users with Administrator permissions on the server.

## Channels Setup
- Set the `"welcome"` and `"bye"` channel IDs in the config to the Discord channels where the bot should send welcome and goodbye messages respectively.

---

If you want to customize embeds or screenshot appearance, remember to update the config JSON accordingly and test changes carefully.

---

## `index.js (v13)` Code:
```javascript
const { Client, Intents, MessageEmbed } = require('discord.js');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS
  ]
});

// ID to your welcome / bye - channel.
const WELCOME_CHANNEL_ID = "";

// Your BOT token.
const TOKEN = "";

// HTML code from which the screen is then taken. (recommended background resolution: 1100x500)
function generateHTML(type, nick, avatarUrl) {
    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome / Bye</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background-image: url('https://i.imgur.com/CUAVXwI.png');
                background-size: cover;
                background-position: center;
                width: 1100px;
                height: 500px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                text-align: center;
                padding: 40px;
                border-radius: 10px;
                width: 90%;
                max-width: 600px;
            }
            .avatar {
                width: 175px;
                height: 175px;
                border-radius: 50%;
                margin-bottom: 30px;
            }
            .message {
                font-size: 46px;
                font-weight: 700;
                color: #fff;
            }
            .sub-message {
                font-size: 16px;
                margin-top: 15px;
                color: #ddd;
                font-weight: 300;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="${avatarUrl}" alt="Avatar" class="avatar">
            <div class="message">${type}, ${nick}</div>
            <div class="sub-message">${type === 'Bye' ? 'It is a pity that you are leaving us. We hope you will come back to us again someday.' : 'We are happy to welcome you! Enjoy your time with us.'}</div>
        </div>
    </body>
    </html>
    `;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(type, nick, avatarUrl, userId) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const html = generateHTML(type, nick, avatarUrl);

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Waiting 2 seconds for the avatar to 100% load before taking a screen
    await sleep(2000);

    const folder = path.join(__dirname, 'images');
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    const filePath = path.join(folder, `${userId}.png`);

    await page.setViewport({ width: 1100, height: 500 });
    await page.screenshot({ path: filePath });

    await browser.close();
    return filePath;
}

async function sendMessage(type, member, filePath) {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        const embed = new MessageEmbed()
            .setTitle(type === 'Welcome' ? 'New user joined the server' : 'User left the server')
            .setDescription(`${type === 'Welcome' ? 'Welcome to the server' : 'Bye, we hope you will come back!'}, ${member.user.username}!`)
            .setImage(`attachment://${member.id}.png`)
            .setColor(type === 'Welcome' ? '#00FF00' : '#FF0000')
            .setTimestamp();

        await channel.send({ embeds: [embed], files: [{ attachment: filePath, name: `${member.id}.png` }] });

        // Delete image from folder.
        fs.unlinkSync(filePath);
    }
}

client.on('guildMemberAdd', async (member) => {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=512`;
    const filePath = await captureScreenshot('Welcome', member.user.username, avatarUrl, member.id);
    
    await sendMessage('Welcome', member, filePath);
});

client.on('guildMemberRemove', async (member) => {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=512`;
    const filePath = await captureScreenshot('Bye', member.user.username, avatarUrl, member.id);
    
    await sendMessage('Bye', member, filePath);
});

client.login(TOKEN);
```

## `index.js (v14)` Code:
```javascript
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// ID to your welcome/bye channel
const WELCOME_CHANNEL_ID = "";

// Your BOT token
const TOKEN = "";

// HTML code from which the screen is then taken. (recommended background resolution: 1100x500)
function generateHTML(type, nick, avatarUrl) {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome / Bye</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background-image: url('https://i.imgur.com/CUAVXwI.png');
                background-size: cover;
                background-position: center;
                width: 1100px;
                height: 500px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .container {
                text-align: center;
                padding: 40px;
                border-radius: 10px;
                width: 90%;
                max-width: 600px;
            }
            .avatar {
                width: 175px;
                height: 175px;
                border-radius: 50%;
                margin-bottom: 30px;
            }
            .message {
                font-size: 46px;
                font-weight: 700;
                color: #fff;
            }
            .sub-message {
                font-size: 16px;
                margin-top: 15px;
                color: #ddd;
                font-weight: 300;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="${avatarUrl}" alt="Avatar" class="avatar">
            <div class="message">${type}, ${nick}</div>
            <div class="sub-message">${type === 'Bye' ? 'It is a pity that you are leaving us. We hope you will come back to us again someday.' : 'We are happy to welcome you! Enjoy your time with us.'}</div>
        </div>
    </body>
    </html>
    `;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(type, nick, avatarUrl, userId) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const html = generateHTML(type, nick, avatarUrl);

  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  // Waiting 2 seconds for the avatar to 100% load before taking a screen
  await sleep(2000);

  const folder = path.join(__dirname, 'images');
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  const filePath = path.join(folder, `${userId}.png`);

  await page.setViewport({ width: 1100, height: 500 });
  await page.screenshot({ path: filePath });

  await browser.close();
  return filePath;
}

async function sendMessage(type, member, filePath) {
  const channel = client.channels.cache.get(WELCOME_CHANNEL_ID);
  if (channel) {
    const embed = new EmbedBuilder()
      .setTitle(type === 'Welcome' ? 'New user joined the server' : 'User left the server')
      .setDescription(`${type === 'Welcome' ? 'Welcome to the server' : 'Bye, we hope you will come back!'}, ${member.user.username}!`)
      .setImage(`attachment://${member.id}.png`)
      .setColor(type === 'Welcome' ? '#00FF00' : '#FF0000')
      .setTimestamp();

    await channel.send({ embeds: [embed], files: [{ attachment: filePath, name: `${member.id}.png` }] });

    // Delete image from folder.
    fs.unlinkSync(filePath);
  }
}

client.on('guildMemberAdd', async (member) => {
  const avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=512`;
  const filePath = await captureScreenshot('Welcome', member.user.username, avatarUrl, member.id);
  
  await sendMessage('Welcome', member, filePath);
});

client.on('guildMemberRemove', async (member) => {
  const avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=512`;
  const filePath = await captureScreenshot('Bye', member.user.username, avatarUrl, member.id);
  
  await sendMessage('Bye', member, filePath);
});

client.login(TOKEN);
```
