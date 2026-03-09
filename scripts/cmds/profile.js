const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const ITEM_FILE = path.join(process.cwd(), "userItems.json");

module.exports = {
    config: {
        name: "profile",
        aliases: ["info", "check"],
        version: "1.2",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "social"
    },

    onStart: async function ({ message, event, usersData }) {
        const { senderID } = event;
        const now = Date.now();

        // --- ⚖️ PNP RESTRICTION GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(
                    `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
                    `   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡\n` +
                    `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
                    `  ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗\n` +
                    `  ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖠𝖼𝗍𝗂𝗏𝖾 𝖶𝖺𝗋𝗋𝖺𝗇𝗍\n` +
                    ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
                    ` ⚖ 𝖯𝖾𝗋𝗌𝗈𝗇𝖺𝗅 𝗂𝗇𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇 𝗌𝖾𝗂𝗓𝖾𝖽.`
                );
            }
        }

        const userData = await usersData.get(senderID);
        const name = await usersData.getName(senderID);

        // --- 🏦 BANK DATA ---
        let loan = 0;
        let bankBalance = 0;
        if (fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            if (bankData[senderID]) {
                loan = bankData[senderID].loan || 0;
                bankBalance = bankData[senderID].balance || 0;
            }
        }

        // --- 🎒 ITEM COUNT ---
        let itemsCount = 0;
        if (fs.existsSync(ITEM_FILE)) {
            const inventory = fs.readJsonSync(ITEM_FILE);
            if (inventory[senderID]) {
                itemsCount = Object.values(inventory[senderID]).reduce((a, b) => a + b, 0);
            }
        }

        const msg = `┏━━━━━━━━━━━━━━━━━━━━┓\n   👤 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡\n┗━━━━━━━━━━━━━━━━━━━━┛\n` +
            ` 👤 𝗡𝗮𝗺𝗲: ${name}\n` +
            ` 🆔 𝗨𝗜𝗗: ${senderID}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            ` 💰 𝗪𝗮𝗹𝗹𝗲𝘁: $${(userData.money || 0).toLocaleString()}\n` +
            ` 🏦 𝗕𝗮𝗻𝗸: $${bankBalance.toLocaleString()}\n` +
            ` 🏛️ 𝗔𝗰𝘁𝗶𝘃𝗲 𝗟𝗼𝗮𝗻: ${loan > 0 ? `$${loan.toLocaleString()}` : "None"}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            ` ⚖️ 𝗦𝘁𝗮𝘁𝘂𝘀: ✅ 𝗖𝗟𝗘𝗔𝗥\n` +
            ` 🎒 𝗜𝘁𝗲𝗺𝘀 𝗢𝘄𝗻𝗲𝗱: ${itemsCount}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            ` 💡 Use !inventory to see items.`;

        return message.reply(msg);
    }
};
