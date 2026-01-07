const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "backpack",
        aliases: ["bp"],
        version: "1.4",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, args, event, api, usersData }) {
        const { senderID } = event;
        const BANK_FILE = path.join(__dirname, "bankData.json");
        const JAIL_FILE = path.join(process.cwd(), "jailData.json");
        const dirPath = path.join(__dirname, "..", "..", "data");
        const backpackPath = path.join(dirPath, "userBackpack.json");

        // 🛡️ PRISONER CHECK
        const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
        const isJailed = jailList[senderID] && Date.now() < jailList[senderID].releaseAt;
        if (isJailed) return message.reply("❌ Prisoners cannot access their backpack!");

        if (!fs.existsSync(dirPath)) fs.ensureDirSync(dirPath);
        if (!fs.existsSync(backpackPath)) fs.writeJsonSync(backpackPath, {});

        const userData = await usersData.get(senderID);
        let backpack = fs.readJsonSync(backpackPath);
        let userBp = backpack[senderID] || { Coal: 0, Iron: 0, Gold: 0, Diamond: 0 };
        const prices = { Coal: 500, Iron: 1500, Gold: 5000, Diamond: 15000 };

        // --- SELL LOGIC ---
        if (args[0] === "sell") {
            let totalEarned = 0;
            let itemsSold = 0;
            for (let ore in userBp) {
                totalEarned += userBp[ore] * prices[ore];
                itemsSold += userBp[ore];
                userBp[ore] = 0; 
            }
            if (totalEarned === 0) return message.reply("Your backpack is empty! Go mining first. ⛏️");

            const originalEarnings = totalEarned;
            let currentMoney = userData.money || 0;
            let debtNote = "";

            // 🏛️ AUTO-PAY BANK LOAN
            if (fs.existsSync(BANK_FILE)) {
                let bankData = fs.readJsonSync(BANK_FILE);
                if (bankData[senderID] && bankData[senderID].loan > 0) {
                    const payment = Math.min(totalEarned, bankData[senderID].loan);
                    bankData[senderID].loan -= payment;
                    totalEarned -= payment;
                    fs.writeJsonSync(BANK_FILE, bankData, { spaces: 2 });
                    debtNote += `\n🏛️ **Bank Debt Paid:** -$${payment.toLocaleString()}`;
                }
            }

            // ⚖️ AUTO-PAY ARREST FINE (Negative Balance)
            if (totalEarned > 0 && currentMoney < 0) {
                const fineAmount = Math.abs(currentMoney);
                const payment = Math.min(totalEarned, fineAmount);
                currentMoney += payment;
                totalEarned -= payment;
                debtNote += `\n⚖️ **Fine Paid:** -$${payment.toLocaleString()}`;
            }

            backpack[senderID] = userBp;
            fs.writeJsonSync(backpackPath, backpack);
            await usersData.set(senderID, { money: currentMoney + totalEarned });

            return message.reply(
                `💰 **𝗦𝗔𝗟𝗘 𝗖𝗢𝗡𝗙𝗜𝗥𝗠𝗘𝗗**\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📦 Sold: **${itemsSold}** items\n` +
                `💵 Net Earned: **$${totalEarned.toLocaleString()}**\n` +
                `✨ Gross: $${originalEarnings.toLocaleString()}\n` +
                `${debtNote}`
            );
        }

        // --- VIEW ---
        const msg = `🎒 **𝗬𝗢𝗨𝗥 𝗕𝗔𝗖𝗞𝗣𝗔𝗖𝗞**\n━━━━━━━━━━━━━━━━━━\n⚫ Coal: ${userBp.Coal}\n⚪ Iron: ${userBp.Iron}\n🟡 Gold: ${userBp.Gold}\n💎 Diamond: ${userBp.Diamond}\n━━━━━━━━━━━━━━━━━━\n💡 Type \`!backpack sell\` to sell everything!`;
        return message.reply(msg);
    }
};