const fs = require("fs-extra");
const path = require("path");

const LOTTO_FILE = path.join(process.cwd(), "lottoEntries.json");
const ITEM_FILE = path.join(process.cwd(), "userItems.json");

module.exports = {
    config: { name: "lotto", version: "1.6", author: "Gab Yu", category: "game" },

    onStart: async function ({ message, event, args }) {
        const { senderID } = event;
        let inventory = fs.existsSync(ITEM_FILE) ? fs.readJsonSync(ITEM_FILE) : {};
        let userInv = inventory[senderID] || {};

        if (!userInv["Lotto Ticket"] || userInv["Lotto Ticket"] <= 0) return message.reply("❌ Buy a ticket first!");

        userInv["Lotto Ticket"] -= 1;
        fs.writeJsonSync(ITEM_FILE, inventory);

        // Save entry to lottoEntries.json
        return message.reply("🎰 **Entry Confirmed!** Jackpot: **20T**.");
    }
};
