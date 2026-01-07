const fs = require("fs");
const path = require("path");
const SHOP_FILE = path.join(__dirname, "userItems.json");

module.exports = {
    config: {
        name: "shop",
        version: "6.5",
        author: "Gab Yu",
        category: "economy"
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID } = event;
        const userData = await usersData.get(senderID);
        
        const gambleItems = {
            "1": { name: "Arena VIP Pass", price: 50000, type: "permanent" },
            "2": { name: "Crystal Dice", price: 100000, type: "permanent" },
            "3": { name: "Lucky Charm", price: 20000, type: "consumable" },
            "4": { name: "Expresso Coffee", price: 5000, type: "consumable" },
            "5": { name: "Merchant License", price: 250000, type: "permanent" }
        };

        if (args[0] !== "buy") {
            let menu = `🏪 𝗚𝗔𝗠𝗕𝗟𝗘𝗥'𝗦 𝗘𝗠𝗣𝗢𝗥𝗜𝗨𝗠 🏪\n━━━━━━━━━━━━━━━\n`;
            for (const id in gambleItems) {
                menu += `${id}. 📦 **${gambleItems[id].name}** - $${gambleItems[id].price.toLocaleString()}\n`;
            }
            return message.reply(menu + `━━━━━━━━━━━━━━━\n💡 Use: !shop buy <number>`);
        }

        const selected = gambleItems[args[1]];
        if (!selected) return message.reply("❌ Invalid item.");
        if (userData.money < selected.price) return message.reply("❌ Insufficient funds.");

        // --- SHARED INVENTORY LOGIC ---
        let allData = fs.existsSync(SHOP_FILE) ? JSON.parse(fs.readFileSync(SHOP_FILE, "utf8")) : {};
        let userInv = allData[senderID] || {};

        if (selected.type === "permanent" && userInv[selected.name]) return message.reply("❌ Already owned.");

        if (selected.type === "permanent") userInv[selected.name] = 1;
        else userInv[selected.name] = (userInv[selected.name] || 0) + 1;

        await usersData.set(senderID, { money: userData.money - selected.price });
        allData[senderID] = userInv;
        fs.writeFileSync(SHOP_FILE, JSON.stringify(allData, null, 2));

        return message.reply(`🎲 Purchase success! **${selected.name}** added to your inventory.`);
    }
};