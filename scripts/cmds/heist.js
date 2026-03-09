const fs = require("fs-extra");
const path = require("path");

const SHOP_FILE = path.join(process.cwd(), "userItems.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");

module.exports = {
    config: { name: "heist", version: "4.3", author: "Gab Yu", category: "economy" },

    onStart: async function ({ message, event, usersData }) {
        const { senderID } = event;
        let allItems = fs.existsSync(SHOP_FILE) ? fs.readJsonSync(SHOP_FILE) : {};
        let userInv = allItems[senderID] || {};

        if (!userInv["Vault Key"] || userInv["Vault Key"] <= 0) {
            return message.reply("🔑 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nYou need a **Vault Key**!");
        }

        userInv["Vault Key"] -= 1;
        const hasSmoke = userInv["Smoke Bomb"] > 0;

        if (Math.random() > 0.5) {
            return message.reply("🎊 **𝗕𝗔𝗡𝗞 𝗛𝗘𝗜𝗦𝗧 𝗦𝗨𝗖𝗖𝗘𝗦𝗦!**");
        } else {
            if (hasSmoke) {
                userInv["Smoke Bomb"] -= 1;
                fs.writeJsonSync(SHOP_FILE, allItems);
                return message.reply("💨 **𝗙𝗔𝗜𝗟𝗘𝗗!** But you used a Smoke Bomb to escape!");
            }
            // Failure logic (Arrest user)
            return message.reply("🚔 **𝗕𝗨𝗦𝗧𝗘𝗗!** You are going to jail.");
        }
    }
};
