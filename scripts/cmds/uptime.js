const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "uptime",
    version: "1.1",
    aliases: ["upt", "up"],
    author: "kaizenji",
    role: 0,
    countDown: 5,
    category: "system"
  },

  onStart: async function ({ message }) {
    const now = moment().tz("Asia/Manila");
    const date = now.format('MMMM Do, YYYY');
    const time = now.format('hh:mm:ss A');

    const uptime = process.uptime();
    const days = Math.floor(uptime / (60 * 60 * 24));
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const minutes = Math.floor((uptime / 60) % 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeString = `${days}𝖽 ${hours}𝗁 ${minutes}𝗆 ${seconds}𝗌`;

    const msg = 
      `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
      `      𝗠𝗔𝗖𝗞𝗬 𝗦𝗬𝗦𝗧𝗘𝗠 𝗨𝗣𝗧𝗜𝗠𝗘\n` +
      `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
      ` ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝗢𝗻𝗹𝗶𝗻𝗲\n` +
      ` ❯ 𝖣𝖺𝗍𝖾: ${date}\n` +
      ` ❯ 𝖳𝗂𝗆𝖾: ${time}\n` +
      ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
      ` ⏳ 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptimeString}\n` +
      ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
      ` 🛡️ 𝖠𝗅𝗅 𝗌𝗒𝗌𝗍𝖾𝗆𝗌 𝗈𝗉𝖾𝗋𝖺𝗍𝗂𝗈𝗇𝖺𝗅.`;

    return message.reply(msg);
  },

  onChat: async function ({ event, message, prefix }) {
    if (event.body && event.body.toLowerCase() === "up") {
      this.onStart({ message, prefix });
    }
  }
};
