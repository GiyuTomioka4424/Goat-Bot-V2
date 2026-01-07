const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "bankData.json");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");
const spamTracker = new Map();

module.exports = {
    config: {
        name: "slots",
        aliases: ["slot", "spin"],
        version: "3.5",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ args, message, event, usersData, api }) {
        const { senderID, threadID } = event;
        const userData = await usersData.get(senderID);

        // 🚨 SPAM / AUTO-ARREST LOGIC
        const now = Date.now();
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        
        if (now - userSpam.last < 1500) { 
            userSpam.count++;
            if (userSpam.count >= 5) {
                const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
                
                // 2 HOURS IN PRISON (2 * 60 * 60 * 1000)
                const sentence = 2 * 60 * 60 * 1000;
                const fine = 20000000;

                jailList[senderID] = { 
                    releaseAt: now + sentence, 
                    reason: "Slot Machine Spamming" 
                };
                fs.writeJsonSync(JAIL_FILE, jailList);
                
                // APPLY ₱20M FINE
                await usersData.set(senderID, { money: (userData.money || 0) - fine }); 
                
                spamTracker.delete(senderID); // Clear tracker
                return message.reply(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n⚠ **Reason:** Slot Spamming\n💸 **Fine:** ₱20,000,000\n⛓ **Sentence:** 2 Hours\n\n*The casino security has escorted you to Macky Prison.*`);
            }
        } else {
            userSpam.count = 0;
        }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // 🚫 PRISONER RESTRICTION
        const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
        if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
            return message.reply("🚫 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nPrisoners are not allowed to use the casino machines!");
        }

        // 🚫 DEBTOR BAN/BLOCK ENFORCEMENT
        let hasLuckCharm = false;
        if (fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            const userBank = bankData[senderID] || { loan: 0, luckCharm: false };
            if (userBank.loan > 0) {
                return message.reply("🚫 **𝗚𝗔𝗠𝗕𝗟𝗜𝗡𝗚 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡**\nYou are banned from gambling while you have an active loan. Pay your debt at the bank first!");
            }
            hasLuckCharm = userBank.luckCharm === true;
        }

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 100) return message.reply("❌ Min bet is $100.");
        if (userData.money < bet) return message.reply("❌ You don't have enough cash in your wallet.");

        // 🎰 START ANIMATION
        const slotItems = ["🍎", "🍋", "🍇", "🍒", "💎", "🎰"];
        const msg = await api.sendMessage("🎰 **𝗦𝗟𝗢𝗧 𝗠𝗔𝗖𝗛𝗜𝗡𝗘 𝗦𝗣𝗜𝗡𝗡𝗜𝗡𝗚...**\n━━━━━━━━━━━━━━━━━━\n[ 🔄 | 🔄 | 🔄 ]\n━━━━━━━━━━━━━━━━━━", threadID);

        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const s1 = slotItems[Math.floor(Math.random() * slotItems.length)];
        const s2 = slotItems[Math.floor(Math.random() * slotItems.length)];
        const s3 = slotItems[Math.floor(Math.random() * slotItems.length)];

        let resultMsg = "";
        if (s1 === s2 && s2 === s3) {
            let win = bet * 15;
            if (hasLuckCharm) win = Math.floor(win * 2.5);
            await usersData.set(senderID, { money: (userData.money || 0) + win });
            resultMsg = `🏆 **𝗝𝗔𝗖𝗞𝗣𝗢𝗧!**\nYou won **$${win.toLocaleString()}**!${hasLuckCharm ? " 🍀" : ""}`;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            let win = bet * 2;
            if (hasLuckCharm) win = Math.floor(win * 2.5);
            await usersData.set(senderID, { money: (userData.money || 0) + win });
            resultMsg = `✨ **𝗠𝗜𝗡𝗢𝗥 𝗪𝗜𝗡!**\nYou won **$${win.toLocaleString()}**.`;
        } else {
            await usersData.set(senderID, { money: (userData.money || 0) - bet });
            resultMsg = `💸 **𝗕𝗘𝗧 𝗟𝗢𝗦𝗧**\nYou lost **$${bet.toLocaleString()}**. Better luck next time!`;
        }

        return api.editMessage(`🎰 **𝗦𝗟𝗢𝗧 𝗠𝗔𝗖𝗛𝗜𝗡𝗘 𝗥𝗘𝗦𝗨𝗟𝗧**\n━━━━━━━━━━━━━━━━━━\n[ ${s1} | ${s2} | ${s3} ]\n━━━━━━━━━━━━━━━━━━\n${resultMsg}`, msg.messageID);
    }
};