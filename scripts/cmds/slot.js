const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const ITEM_FILE = path.join(process.cwd(), "userItems.json");
const activeSpins = new Set();
const spamTracker = new Map();

module.exports = {
    config: {
        name: "slots",
        aliases: ["slot", "spin"],
        version: "4.5",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ args, message, event, usersData, api, threadsData }) {
        const { senderID, threadID } = event;
        const userData = await usersData.get(senderID);
        const now = Date.now();

        if (activeSpins.has(senderID)) return message.reply("⏳ **𝗦𝗟𝗢𝗧𝗦 𝗔𝗖𝗧𝗜𝗩𝗘**\nPlease wait for your current spin to finish!");

        // --- 🚔 CASINO SECURITY (SPAM GUARD) ---
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        if (now - userSpam.last < 1500) { 
            userSpam.count++;
            if (userSpam.count >= 4) {
                let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
                const fine = 20000000;
                prisonList[senderID] = { 
                    name: userData.name || "Gambler",
                    releaseAt: now + (2 * 60 * 60 * 1000), 
                    reason: "Casino Exploit (Macro Spamming)" 
                };
                fs.writeJsonSync(PRISON_FILE, prisonList);
                await usersData.set(senderID, { money: (userData.money || 0) - fine }); 
                
                const alert = `┏━━━━━━━━━━━━━━━━━━━━┓\n   🚨 𝗠𝗔𝗖𝗞𝗬 𝗖𝗔𝗦𝗜𝗡𝗢 𝗔𝗟𝗘𝗥𝗧\n┗━━━━━━━━━━━━━━━━━━━━┛\n ❯ 𝖲𝗎𝗌𝗉𝖾𝖼𝗍: ${userData.name}\n ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖤𝗑𝗉𝗅𝗈𝗂𝗍 𝖠𝗍𝗍𝖾𝗆𝗉𝗍\n ❯ 𝖥𝗂𝗇𝖾: $${fine.toLocaleString()}\n ⚖️ 𝖲𝖾𝗇𝗍𝖾𝗇𝖼𝖾: 2 𝖧𝗈𝗎𝗋𝗌`;
                const threads = (await threadsData.getAll()).filter(t => t.isGroup);
                for (const t of threads) { api.sendMessage(alert, t.threadID); }
                return;
            }
        } else { userSpam.count = 0; }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // --- 🚨 GUARDS ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) return message.reply("🚨 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nInmates are not allowed on the casino floor.");
        }
        if (fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            if (bankData[senderID] && bankData[senderID].loan > 0) return message.reply("🚫 **𝗟𝗢𝗔𝗡 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗**\nYou cannot gamble while you owe the bank! Pay your loan first.");
        }

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 100) return message.reply("❌ **𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗕𝗘𝗧**\nUsage: `!slots [amount]` (Min: $100)");
        if (userData.money < bet) return message.reply("💸 **𝗕𝗥𝗢𝗞𝗘 𝗔𝗟𝗘𝗥𝗧**\nYou don't have enough money for that bet.");

        activeSpins.add(senderID);
        const slotItems = ["🍎", "🍋", "🍇", "🍒", "💎", "🎰"];
        
        // --- 🎰 UNIQUE ANIMATION ---
        const msg = await api.sendMessage(
            `✨ 𝗠𝗔𝗖𝗞𝗬'𝗦 𝗡𝗘𝗢𝗡 𝗖𝗔𝗦𝗜𝗡𝗢 ✨\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🎰 [ 🔄 | 🔄 | 🔄 ]\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `💰 **Betting:** $${bet.toLocaleString()}\n` +
            `🎰 *Spinning the reels...*`, threadID);

        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const s = [slotItems[Math.floor(Math.random() * 6)], slotItems[Math.floor(Math.random() * 6)], slotItems[Math.floor(Math.random() * 6)]];
        let winMultiplier = 0;
        let usedCharm = false;

        // Logic for Winning
        if (s[0] === s[1] && s[1] === s[2]) winMultiplier = 15;
        else if (s[0] === s[1] || s[1] === s[2] || s[0] === s[2]) winMultiplier = 2;

        let inventory = fs.existsSync(ITEM_FILE) ? fs.readJsonSync(ITEM_FILE) : {};
        let userInv = inventory[senderID] || {};
        let hasLuckCharm = userInv["Luck Charm"] > 0;

        let finalResultMsg = "";
        if (winMultiplier > 0) {
            // Apply Luck Charm Boost
            if (hasLuckCharm) {
                winMultiplier *= 3; // 3x Win Boost
                userInv["Luck Charm"] -= 1; // 1x Consumption
                inventory[senderID] = userInv;
                fs.writeJsonSync(ITEM_FILE, inventory);
                usedCharm = true;
            }
            const reward = bet * winMultiplier;
            await usersData.set(senderID, { money: userData.money + reward });
            finalResultMsg = `🏆 **𝗪𝗜𝗡𝗡𝗘𝗥!**\n💰 **Payout:** $${reward.toLocaleString()}\n${usedCharm ? "🍀 *Luck Charm gave you a 3x Boost!*" : ""}`;
        } else {
            await usersData.set(senderID, { money: userData.money - bet });
            finalResultMsg = `💸 **𝗕𝗘𝗧 𝗟𝗢𝗦𝗧**\n💰 **Loss:** -$${bet.toLocaleString()}\n*Better luck next time!*`;
        }

        activeSpins.delete(senderID);
        return api.editMessage(
            `✨ 𝗠𝗔𝗖𝗞𝗬'𝗦 𝗡𝗘𝗢𝗡 𝗖𝗔𝗦𝗜𝗡𝗢 ✨\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🎰 [ ${s[0]} | ${s[1]} | ${s[2]} ]\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `${finalResultMsg}`, msg.messageID);
    }
};
