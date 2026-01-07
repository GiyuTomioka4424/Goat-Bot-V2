const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "sarisari",
        aliases: ["store", "market", "macky"],
        version: "3.0",
        author: "Gab Yu",
        category: "economy"
    },

    onStart: async function ({ message, event, usersData }) {
        const { senderID } = event;
        const userData = await usersData.get(senderID);

        // Visual update only - prices and logic remain as previously established
        const menu = `🏪 ➤ 𝗠𝗔𝗖𝗞𝗬 𝗦𝗔𝗥𝗜-𝗦𝗔𝗥𝗜 𝗦𝗧𝗢𝗥𝗘
━━━━━━━━━━━━━━━

⚒ 𝗘𝗤𝗨𝗜𝗣𝗠𝗘𝗡𝗧
[ 1 ] Iron Pickaxe - $50,000
    ↳ Note: Required for !mine. Has durability.

🍀 𝗕𝗢𝗢𝗦𝗧𝗘𝗥𝗦
[ 2 ] Lucky Charm - $80,000
    ↳ Note: Use it to get 2x Mining or 3x Slots!

🕶 𝗛𝗘𝗜𝗦𝗧 𝗚𝗘𝗔𝗥
[ 3 ] Hacker Tablet - $150,000
    ↳ Note: Higher success rate in !heist.
[ 4 ] Smoke Bomb - $30,000
    ↳ Note: Escape fines if a heist fails.
[ 5 ] Vault Key - $500,000
    ↳ Note: Required to start a !heist.

━━━━━━━━━━━━━━━
🛒 𝗧𝗼 𝗯𝘂𝘆: !buy <number> <amount>
🎒 𝗧𝗼 𝘂𝘀𝗲: !inv use <item name>
💰 𝗧𝗼 𝘀𝗲𝗹𝗹: !inv sell <item name>`;

        return message.reply(menu);
    }
};