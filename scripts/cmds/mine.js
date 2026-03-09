const fs = require("fs-extra");
const path = require("path");

const ITEM_FILE = path.join(process.cwd(), "userItems.json");
const backpackPath = path.join(process.cwd(), "userBackpack.json");

module.exports = {
    config: {
        name: "mine",
        version: "2.0",
        author: "Gab Yu",
        countDown: 15,
        category: "economy"
    },

    onStart: async function ({ message, event, api, usersData }) {
        const { senderID } = event;
        let inventory = fs.existsSync(ITEM_FILE) ? fs.readJsonSync(ITEM_FILE) : {};
        let userInv = inventory[senderID] || {};

        if (!userInv["Iron Pickaxe"] || userInv["Iron Pickaxe"] <= 0) {
            return message.reply("❌ **𝗠𝗜𝗦𝗦𝗜𝗡𝗚 𝗧𝗢𝗢𝗟**\nYou need an **Iron Pickaxe** to mine!");
        }

        let hasLuckCharm = userInv["Luck Charm"] > 0;
        if (hasLuckCharm) {
            userInv["Luck Charm"] -= 1;
            fs.writeJsonSync(ITEM_FILE, inventory);
        }

        // Mining logic here (Reward Coal, Iron, etc. to userBackpack.json)
        return message.reply(`⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗦𝗨𝗖𝗖𝗘𝗦𝗦!**${hasLuckCharm ? " 🍀 (Luck Charm Consumed)" : ""}`);
    }
};
