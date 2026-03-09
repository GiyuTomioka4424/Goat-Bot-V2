const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const ITEM_FILE = path.join(process.cwd(), "userItems.json");

module.exports = {
    config: {
        name: "sarisari",
        aliases: ["shop", "store", "macky"],
        version: "3.9",
        author: "Gab Yu",
        countDown: 5,
        category: "economy"
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID } = event;
        const now = Date.now();
        const userData = await usersData.get(senderID);

        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) return message.reply("🚨 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**");
        }

        const items = {
            "1": { name: "Iron Pickaxe", price: 50000 },
            "2": { name: "Luck Charm", price: 80000 },
            "3": { name: "Lotto Ticket", price: 5000 },
            "4": { name: "Hacker Tablet", price: 150000 },
            "5": { name: "Smoke Bomb", price: 30000 },
            "6": { name: "Vault Key", price: 500000 }
        };

        if (args[0] === "buy") {
            const itemID = args[1];
            const amount = parseInt(args[2]) || 1;
            const selected = items[itemID];
            if (!selected) return message.reply("❌ Invalid Item Number.");

            const totalCost = selected.price * amount;
            if (userData.money < totalCost) return message.reply(`💸 You need $${totalCost.toLocaleString()}.`);

            await usersData.set(senderID, { money: userData.money - totalCost });
            let inventory = fs.existsSync(ITEM_FILE) ? fs.readJsonSync(ITEM_FILE) : {};
            if (!inventory[senderID]) inventory[senderID] = {};
            inventory[senderID][selected.name] = (inventory[senderID][selected.name] || 0) + amount;
            fs.writeJsonSync(ITEM_FILE, inventory);

            return message.reply(`🛍️ **𝗣𝗨𝗥𝗖𝗛𝗔𝗦𝗘 𝗖𝗢𝗡𝗙𝗜𝗥𝗠𝗘𝗗**\n📦 **Item:** ${selected.name}\n🔢 **Amount:** x${amount}`);
        }

        const menu = `🏪 ➤ 𝗠𝗔𝗖𝗞𝗬 𝗦𝗔𝗥𝗜-𝗦𝗔𝗥𝗜 𝗦𝗧𝗢𝗥𝗘\n━━━━━━━━━━━━━━━\n[ 1 ] Iron Pickaxe - $50,000\n[ 2 ] Luck Charm - $80,000\n[ 3 ] Lotto Ticket - $5,000\n[ 4 ] Hacker Tablet - $150,000\n[ 5 ] Smoke Bomb - $30,000\n[ 6 ] Vault Key - $500,000\n━━━━━━━━━━━━━━━\n🛒 !sarisari buy <number> <amount>`;
        return message.reply(menu);
    }
};
