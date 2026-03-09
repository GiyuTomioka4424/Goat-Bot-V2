const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const backpackPath = path.join(process.cwd(), "userBackpack.json");
const spamTracker = new Map();

module.exports = {
    config: {
        name: "backpack",
        aliases: ["bp"],
        version: "1.7",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { senderID } = event;
        const now = Date.now();
        
        if (!fs.existsSync(backpackPath)) fs.writeJsonSync(backpackPath, {});
        const userData = await usersData.get(senderID);

        // --- 👮 AUTO-ARREST SPAM MONITOR ---
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        if (now - userSpam.last < 1500) { 
            userSpam.count++;
            if (userSpam.count >= 5) {
                let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
                const sentence = 1 * 60 * 60 * 1000; 
                const fine = 50000;

                prisonList[senderID] = { 
                    name: userData.name || "Miner",
                    releaseAt: now + sentence, 
                    reason: "Backpack Exploitation / Spamming" 
                };
                fs.writeJsonSync(PRISON_FILE, prisonList);
                
                await usersData.set(senderID, { money: (userData.money || 0) - fine }); 
                spamTracker.delete(senderID); 
                return message.reply(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n⚠ **Reason:** Backpack Spamming\n💸 **Fine:** $50,000\n⛓ **Sentence:** 1 Hour`);
            }
        } else { userSpam.count = 0; }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // --- 🚨 MACKY PNP GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(`🚨 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nInventory access seized while in custody.`);
            }
        }

        let backpack = fs.readJsonSync(backpackPath);
        let userBp = backpack[senderID] || { Coal: 0, Iron: 0, Gold: 0, Diamond: 0 };
        const prices = { Coal: 500, Iron: 1500, Gold: 5000, Diamond: 15000 };

        // --- 💰 SELL LOGIC ---
        if (args[0] === "sell") {
            let totalEarned = 0;
            for (let ore in prices) {
                totalEarned += (userBp[ore] || 0) * prices[ore];
                userBp[ore] = 0; 
            }
            if (totalEarned === 0) return message.reply("❌ Your backpack is empty! Go mining first. ⛏️");

            const gross = totalEarned;
            let currentMoney = userData.money || 0;
            let debtNote = "";

            // 🏛️ AUTO-PAY BANK LOAN (Stage 2 Integration)
            if (fs.existsSync(BANK_FILE)) {
                let bankData = fs.readJsonSync(BANK_FILE);
                if (bankData[senderID] && bankData[senderID].loan > 0) {
                    const payment = Math.min(totalEarned, bankData[senderID].loan);
                    bankData[senderID].loan -= payment;
                    totalEarned -= payment;
                    fs.writeJsonSync(BANK_FILE, bankData);
                    debtNote += `\n🏛️ **Bank Debt Paid:** -$${payment.toLocaleString()}`;
                }
            }

            // ⚖️ AUTO-PAY ARREST FINES
            if (totalEarned > 0 && currentMoney < 0) {
                const fineAmount = Math.abs(currentMoney);
                const payment = Math.min(totalEarned, fineAmount);
                currentMoney += payment;
                totalEarned -= payment;
                debtNote += `\n⚖️ **Fine Cleared:** -$${payment.toLocaleString()}`;
            }

            backpack[senderID] = userBp;
            fs.writeJsonSync(backpackPath, backpack);
            await usersData.set(senderID, { money: currentMoney + totalEarned });

            return message.reply(
                `💰 **𝗦𝗔𝗟𝗘 𝗖𝗢𝗡𝗙𝗜𝗥𝗠𝗘𝗗**\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💵 **Gross Earnings:** $${gross.toLocaleString()}\n` +
                `💸 **Net Profit:** $${totalEarned.toLocaleString()}\n` +
                `✨ **Status:** Ores converted to cash.${debtNote}`
            );
        }

        // --- 🎒 VIEW LOGIC ---
        let msg = `┏━━━━━━━━━━━━━━━━━━━━┓\n   🎒 ${userData.name.toUpperCase()}'𝗦 𝗕𝗣\n┗━━━━━━━━━━━━━━━━━━━━┛\n`;
        const icons = { Coal: "⚫", Iron: "⚪", Gold: "🟡", Diamond: "💎" };
        
        for (let ore in prices) {
            const count = userBp[ore] || 0;
            msg += ` ❯ ${icons[ore]} ${ore}: **${count}**\n`;
        }
        
        msg += ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n 🛒 Use \`!bp sell\` to cash out.`;
        return message.reply(msg);
    }
};
