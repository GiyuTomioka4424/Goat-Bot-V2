const fs = require("fs");
const path = require("path");
const SHOP_FILE = path.join(__dirname, "userItems.json");

module.exports = {
    config: {
        name: "buy",
        version: "2.0",
        author: "Gab Yu",
        countDown: 5,
        category: "economy"
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID } = event;
        const itemNumber = args[0];
        const quantity = parseInt(args[1]) || 1;

        if (!itemNumber || isNaN(quantity) || quantity <= 0) {
            return message.reply("🛒 Usage: !buy <item number> <quantity>\nExample: !buy 2 1 (to buy 1 Lucky Charm)");
        }

        // Define the items based on the Store numbers
        const storeItems = {
            "1": { name: "Iron Pickaxe", price: 50000, type: "tool" },
            "2": { name: "Lucky Charm", price: 80000, type: "item" },
            "3": { name: "Hacker Tablet", price: 150000, type: "item" },
            "4": { name: "Smoke Bomb", price: 30000, type: "item" },
            "5": { name: "Vault Key", price: 500000, type: "item" }
        };

        const selected = storeItems[itemNumber];
        if (!selected) return message.reply("❌ Invalid item number! Check !store for the list.");

        const totalPrice = selected.price * quantity;
        const userData = await usersData.get(senderID);
        const userMoney = userData.money || 0;

        if (userMoney < totalPrice) {
            return message.reply(`❌ You need $${totalPrice.toLocaleString()} to buy this, but you only have $${userMoney.toLocaleString()}.`);
        }

        // --- DATABASE LOGIC ---
        if (!fs.existsSync(SHOP_FILE)) fs.writeFileSync(SHOP_FILE, "{}", "utf8");
        let allData = JSON.parse(fs.readFileSync(SHOP_FILE, "utf8"));
        let userInv = allData[senderID] || {};

        if (selected.type === "tool") {
            // Tools have HP/Durability
            userInv[selected.name] = { durability: 100 };
        } else {
            // Items stack by quantity
            userInv[selected.name] = (userInv[selected.name] || 0) + quantity;
        }

        // Deduct Money and Save
        await usersData.set(senderID, { money: userMoney - totalPrice });
        allData[senderID] = userInv;
        fs.writeFileSync(SHOP_FILE, JSON.stringify(allData, null, 2), "utf8");

        return message.reply(`🛍️ ➤ 𝗣𝗨𝗥𝗖𝗛𝗔𝗦𝗘 𝗦𝗨𝗖𝗖𝗘𝗦𝗦\n━━━━━━━━━━━━━━━\nYou bought: **${quantity}x ${selected.name}**\nTotal Cost: **$${totalPrice.toLocaleString()}**\n━━━━━━━━━━━━━━━\nType !inv to see your items!`);
    }
};