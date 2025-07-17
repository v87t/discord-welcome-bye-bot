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
