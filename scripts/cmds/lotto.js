const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "bankData.json");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");
const LOTTO_FILE = path.join(process.cwd(), "lottoEntries.json");

module.exports = {
    config: {
        name: "lotto",
        version: "1.0",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ message, event, api, usersData, args, permission }) {
        const { senderID, threadID } = event;

        // --- ADMIN: SPIN ---
        if (args[0] === "spin") {
            if (permission < 1) return message.reply("❌ Admins only.");
            const entries = fs.existsSync(LOTTO_FILE) ? fs.readJsonSync(LOTTO_FILE) : [];
            if (entries.length === 0) return message.reply("⚠️ No one has entered the lotto yet.");

            // Generate Winning Numbers (4 numbers between 1-70)
            const winningNumbers = [];
            while (winningNumbers.length < 4) {
                const n = Math.floor(Math.random() * 70) + 1;
                if (!winningNumbers.includes(n)) winningNumbers.push(n);
            }
            const winStr = winningNumbers.sort((a, b) => a - b).join(" - ");

            // Find Winners (Must match all 4 numbers)
            const winners = entries.filter(e => JSON.stringify(e.numbers.sort((a, b) => a - b)) === JSON.stringify(winningNumbers.sort((a, b) => a - b)));
            
            const prizes = [900000000, 1000000000, 10000000000];
            const finalPrize = prizes[Math.floor(Math.random() * prizes.length)];

            const threads = (await api.getThreadList(50, null, ["INBOX"])).filter(t => t.isGroup);
            
            if (winners.length > 0) {
                const luckyWinner = winners[Math.floor(Math.random() * winners.length)]; // Only 1 winner as per request
                const name = await usersData.getName(luckyWinner.uid);
                
                let prizeRemaining = finalPrize;
                const u = await usersData.get(luckyWinner.uid);
                let currentMoney = u.money || 0;
                let bankData = fs.existsSync(BANK_FILE) ? fs.readJsonSync(BANK_FILE) : {};

                // Auto-Pay Logic
                if (bankData[luckyWinner.uid]?.loan > 0) {
                    const toLoan = Math.min(prizeRemaining, bankData[luckyWinner.uid].loan);
                    bankData[luckyWinner.uid].loan -= toLoan;
                    prizeRemaining -= toLoan;
                    fs.writeJsonSync(BANK_FILE, bankData, { spaces: 2 });
                }
                if (prizeRemaining > 0 && currentMoney < 0) {
                    const toFine = Math.min(prizeRemaining, Math.abs(currentMoney));
                    currentMoney += toFine;
                    prizeRemaining -= toFine;
                }
                await usersData.set(luckyWinner.uid, { money: currentMoney + prizeRemaining });

                const winMsg = `🎉 **𝗠𝗔𝗖𝗞𝗬 𝗟𝗢𝗧𝗧𝗢 𝗪𝗜𝗡𝗡𝗘𝗥** 🎉\n━━━━━━━━━━━━━━━━━━\nWinning Numbers: **${winStr}**\n\n🏆 Winner: **${name}**\n💰 Prize: **$${finalPrize.toLocaleString()}**\n\n⚠️ *Debt was automatically deducted from the prize.*`;
                threads.forEach(g => api.sendMessage(winMsg, g.threadID));
            } else {
                const noWinMsg = `🎰 **𝗟𝗢𝗧𝗧𝗢 𝗗𝗥𝗔𝗪 𝗥𝗘𝗦𝗨𝗟𝗧𝗦**\n━━━━━━━━━━━━━━━━━━\nWinning Numbers: **${winStr}**\n\n❌ **No winners this time.**\nKeep playing to win up to $10 Billion!`;
                threads.forEach(g => api.sendMessage(noWinMsg, g.threadID));
            }

            fs.writeJsonSync(LOTTO_FILE, []); // Reset for next draw
            return;
        }

        // --- PLAYER: JOIN ---
        const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
        if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) return message.reply("🚫 Prisoners are banned from the Lotto!");

        if (args.length < 4) return message.reply("❌ Usage: `!lotto <num1> <num2> <num3> <num4>`\nExample: `!lotto 12 42 14 63` (Numbers 1-70)");

        const numbers = args.slice(0, 4).map(Number);
        if (numbers.some(n => isNaN(n) || n < 1 || n > 70)) return message.reply("❌ Choose 4 numbers between 1 and 70.");

        const userData = await usersData.get(senderID);
        const fee = 100;
        await usersData.set(senderID, { money: (userData.money || 0) - fee });

        const entries = fs.existsSync(LOTTO_FILE) ? fs.readJsonSync(LOTTO_FILE) : [];
        entries.push({ uid: senderID, numbers });
        fs.writeJsonSync(LOTTO_FILE, entries);

        return message.reply(`🎫 **𝗟𝗢𝗧𝗧𝗢 𝗘𝗡𝗧𝗥𝗬 𝗙𝗜𝗟𝗘𝗗**\nNumbers: ${numbers.join(" - ")}\nFee: -$${fee} deducted.\n\nGood luck! The prize pool is up to $10B!`);
    }
};