const fs = require("fs");
const path = require("path");
const SHOP_FILE = path.join(__dirname, "userItems.json");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");

module.exports = {
    config: {
        name: "heist",
        aliases: ["rob", "robvault", "mission"],
        version: "3.1",
        author: "Gab Yu",
        countDown: 60,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, event, usersData }) {
        const { senderID } = event;
        
        // Check if already in jail
        const jailList = fs.existsSync(JAIL_FILE) ? JSON.parse(fs.readFileSync(JAIL_FILE, "utf8")) : {};
        if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
            return message.reply("🚫 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nPrisoners cannot start a heist from inside a cell!");
        }

        if (!fs.existsSync(SHOP_FILE)) {
            return message.reply("❌ You have no items! Visit the !store to buy a 🔑 Vault Key first.");
        }

        let allData = JSON.parse(fs.readFileSync(SHOP_FILE, "utf8"));
        let userInv = allData[senderID] || {};

        if (!userInv["Vault Key"] || userInv["Vault Key"] <= 0) {
            return message.reply("🔑 ➤ 𝗛𝗘𝗜𝗦𝗧\n━━━━━━━━━━━━━━━\n❌ Access Denied! You need a **Vault Key** to enter the Central Bank vault. Buy one at the !store.");
        }

        userInv["Vault Key"] -= 1;
        if (userInv["Vault Key"] <= 0) delete userInv["Vault Key"];

        const hasTablet = userInv["Hacker Tablet"] > 0;
        const hasSmoke = userInv["Smoke Bomb"] > 0;

        let chance = Math.random();
        let successRate = hasTablet ? 0.65 : 0.30;

        let msg = `🎬 ➤ 𝗠𝗜𝗦𝗦𝗜𝗢𝗡 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦\n━━━━━━━━━━━━━━━\nYou used 1x 🔑 Vault Key to infiltrate the bank...\n\n`;

        if (chance < successRate) {
            const loot = Math.floor(Math.random() * 400000) + 100000;
            const userData = await usersData.get(senderID);
            const userMoney = userData.money || 0;
            
            await usersData.set(senderID, { money: userMoney + loot });
            msg += `🎊 𝗦𝗨𝗖𝗖𝗘𝗦𝗦!\n${hasTablet ? "📟 Hacker Tablet bypassed the security!" : "You cracked the code manually."}\n💰 𝗟𝗼𝗼𝘁: $${loot.toLocaleString()}`;
        } else {
            if (hasSmoke) {
                userInv["Smoke Bomb"] -= 1;
                if (userInv["Smoke Bomb"] <= 0) delete userInv["Smoke Bomb"];
                msg += `👮 𝗙𝗔𝗜𝗟𝗘𝗗!\nThe alarms tripped! You threw a 💨 Smoke Bomb and vanished before the SWAT arrived. You lost no money.`;
            } else {
                const fine = 50000;
                const jailTime = 30 * 60 * 1000; // 30 Minutes
                const userData = await usersData.get(senderID);
                const userMoney = userData.money || 0;
                
                // Set Fine
                await usersData.set(senderID, { money: Math.max(0, userMoney - fine) });
                
                // Add to Jail
                jailList[senderID] = { 
                    releaseAt: Date.now() + jailTime, 
                    reason: "Attempted Bank Robbery" 
                };
                fs.writeFileSync(JAIL_FILE, JSON.stringify(jailList, null, 2), "utf8");
                
                msg += `🚓 𝗕𝗨𝗦𝗧𝗘𝗗!\nThe guards caught you! You were fined $${fine.toLocaleString()} and sentenced to **30 minutes** in jail.`;
            }
        }

        allData[senderID] = userInv;
        fs.writeFileSync(SHOP_FILE, JSON.stringify(allData, null, 2), "utf8");

        return message.reply(msg + "\n━━━━━━━━━━━━━━━");
    }
};