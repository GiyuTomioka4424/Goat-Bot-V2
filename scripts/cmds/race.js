const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "bankData.json");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");
const BET_FILE = path.join(process.cwd(), "activeBets.json");

if (!global.raceSystem) {
    global.raceSystem = {
        isOpen: false,
        timer: null
    };
}

module.exports = {
    config: {
        name: "race",
        version: "3.2",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ message, event, api, usersData, args, permission }) {
        const { threadID, senderID } = event;
        const system = global.raceSystem;

        // --- ADMIN: START RACE ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.isOpen) return message.reply("⚠️ A race is already in progress.");

            system.isOpen = true;
            fs.writeJsonSync(BET_FILE, []);

            const threads = (await api.getThreadList(100, null, ["INBOX"])).filter(t => t.isGroup);
            message.reply(`🚀 Broadcasting to ${threads.length} groups. Race starts in 2 minutes...`);

            for (const g of threads) {
                api.sendMessage(
                    "🏁 **𝗠𝗔𝗖𝗞𝗬 𝗚𝗟𝗢𝗕𝗔𝗟 𝗗𝗘𝗥𝗕𝗬**\n━━━━━━━━━━━━━━━━━━\n" +
                    "🏇 **Status:** 𝗕𝗘𝗧𝗧𝗜𝗡𝗚 𝗢𝗣𝗘𝗡 (𝟮 𝗠𝗶𝗻𝘀)\n" +
                    "💰 **Multiplier:** 3.0x Wins\n\n" +
                    "👉 **USAGE:**\n" +
                    "Type: `!race bet <1-4> <amount>`\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "⚠️ *Limit: 1 Horse per Person.*\n" +
                    "⚠️ *Prisoners & Debtors are BANNED.*", g.threadID);
                await new Promise(res => setTimeout(res, 1000)); 
            }

            system.timer = setTimeout(async () => {
                const bets = fs.readJsonSync(BET_FILE);
                
                if (bets.length === 0) {
                    system.isOpen = false;
                    return threads.forEach(g => api.sendMessage("🏁 **𝗥𝗔𝗖𝗘 𝗖𝗔𝗡𝗖𝗘𝗟𝗟𝗘𝗗**: No bets placed.", g.threadID));
                }

                const horses = ["Thunderbolt 🐎", "Star Dash 🏇", "Zebra King 🦓", "Mystic Soul 🦄"];
                const winnerIdx = Math.floor(Math.random() * 4) + 1;
                
                for (const g of threads) {
                    api.sendMessage("🏇 **𝗧𝗛𝗘 𝗥𝗔𝗖𝗘 𝗜𝗦 𝗢𝗡!**\n━━━━━━━━━━━━━━\n[ 🐎🏇🦓🦄        🏁 ]\n\n*The horses are galloping! Results in 10 seconds...*", g.threadID);
                }

                await new Promise(res => setTimeout(res, 10000));

                let winnerAnnouncement = "";
                for (const b of bets) {
                    if (b.horse === winnerIdx) {
                        const prize = b.amount * 3;
                        const u = await usersData.get(b.uid);
                        await usersData.set(b.uid, { money: (u.money || 0) + prize });
                        winnerAnnouncement += `👤 ${b.name}: $${prize.toLocaleString()}\n`;
                    }
                }

                const resultMsg = `🏆 **𝗥𝗔𝗖𝗘 𝗥𝗘𝗦𝗨𝗟𝗧𝗦**\n━━━━━━━━━━━━━━\nWinner: **Horse ${winnerIdx} - ${horses[winnerIdx - 1]}**\n\n✨ **WINNERS:**\n${winnerAnnouncement || "No winners this time."}\n━━━━━━━━━━━━━━`;
                
                threads.forEach(g => api.sendMessage(resultMsg, g.threadID));
                
                system.isOpen = false;
                fs.writeJsonSync(BET_FILE, []);
            }, 120000); 
            return;
        }

        // --- ACTION: BET ---
        if (args[0] === "bet") {
            if (!system.isOpen) return message.reply("🏟️ No race is currently open.");
            
            const bets = fs.readJsonSync(BET_FILE);
            // 🛑 CHECK IF ALREADY BETTED (NEW)
            if (bets.some(b => b.uid === senderID)) return message.reply("❌ You already placed a bet! You can only bet on **one horse** per race.");

            const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
            const isJailed = jailList[senderID] && Date.now() < jailList[senderID].releaseAt;
            const bankData = fs.existsSync(BANK_FILE) ? fs.readJsonSync(BANK_FILE) : {};
            const hasLoan = bankData[senderID] && bankData[senderID].loan > 0;
            const userData = await usersData.get(senderID);

            if (isJailed) return message.reply("🚫 𝗣𝗥𝗜𝗦𝗢𝗡𝗘𝗥 𝗕𝗔𝗡𝗡𝗘𝗗!");
            if (hasLoan || (userData.money || 0) < 0) return message.reply("🚫 𝗗𝗘𝗕𝗧 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗!");

            const horseID = parseInt(args[1]);
            const amount = parseInt(args[2]);

            if (isNaN(horseID) || horseID < 1 || horseID > 4 || isNaN(amount) || amount < 100) 
                return message.reply("❌ Use: `!race bet <1-4> <amount>`");
            