const fs = require("fs-extra");
const path = require("path");

// FIXED: Using process.cwd() for global synchronization
const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const BET_FILE = path.join(process.cwd(), "activeBets.json");
const spamTracker = new Map();

if (!global.raceSystem) {
    global.raceSystem = {
        isOpen: false,
        timer: null
    };
}

module.exports = {
    config: {
        name: "race",
        aliases: ["derby", "horse"],
        version: "3.3.1",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "game"
    },

    onStart: async function ({ message, event, api, usersData, args, permission, threadsData }) {
        const { threadID, senderID } = event;
        const system = global.raceSystem;
        const now = Date.now();

        // --- 👮 AUTO-ARREST SPAM LOGIC ---
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        if (now - userSpam.last < 1000) {
            userSpam.count++;
            if (userSpam.count >= 4) {
                let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
                const sentence = 2 * 60 * 60 * 1000; 
                const fine = 5000000;
                const uData = await usersData.get(senderID);

                prisonList[senderID] = { 
                    name: uData.name || "Derby Spammer",
                    releaseAt: now + sentence, 
                    reason: "Global Derby Disruption (Spam)" 
                };
                fs.writeJsonSync(PRISON_FILE, prisonList);
                await usersData.set(senderID, { money: (uData.money || 0) - fine });
                spamTracker.delete(senderID);
                return message.reply(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n⚠ **Reason:** Derby Spamming\n💸 **Fine:** $5,000,000\n⛓ **Sentence:** 2 Hours`);
            }
        } else { userSpam.count = 0; }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // --- BROADCAST HELPER ---
        const broadcast = async (content) => {
            const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
            for (const thread of allThreads) {
                api.sendMessage(content, thread.threadID);
            }
        };

        const design = (status, body) =>
            `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
            `      𝗠𝗔𝗖𝗞𝗬 𝗚𝗟𝗢𝗕𝗔𝗟 𝗗𝗘𝗥𝗕𝗬\n` +
            `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
            ` ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: ${status}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            `${body}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

        // --- 🎮 ACTION: BETTING ---
        if (args[0] === "bet") {
            if (!system.isOpen) return message.reply("❌ The stadium is closed. Wait for an admin to start the race!");
            
            // 🚨 PRISON CHECK
            if (fs.existsSync(PRISON_FILE)) {
                const prisonList = fs.readJsonSync(PRISON_FILE);
                if (prisonList[senderID] && now < prisonList[senderID].releaseAt) return message.reply("🚨 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗:** Prisoners cannot bet!");
            }

            // 🏛️ LOAN CHECK
            if (fs.existsSync(BANK_FILE)) {
                const bankData = fs.readJsonSync(BANK_FILE);
                if (bankData[senderID] && bankData[senderID].loan > 0) return message.reply("🚫 **𝗟𝗢𝗔𝗡 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗:** Pay your bank debt first!");
            }

            const horse = parseInt(args[1]);
            const amount = parseInt(args[2]);
            const uData = await usersData.get(senderID);

            if (isNaN(horse) || horse < 1 || horse > 4) return message.reply("❌ Pick a horse [1-4].");
            if (isNaN(amount) || amount < 100) return message.reply("❌ Min bet is $100.");
            if (uData.money < amount) return message.reply("💸 You don't have enough money!");

            await usersData.set(senderID, { money: uData.money - amount });
            
            let bets = fs.existsSync(BET_FILE) ? fs.readJsonSync(BET_FILE) : [];
            bets.push({ uid: senderID, name: uData.name, horse: horse, amount: amount });
            fs.writeJsonSync(BET_FILE, bets);

            return message.reply(`✅ **𝗕𝗘𝗧 𝗣𝗟𝗔𝗖𝗘𝗗:** $${amount.toLocaleString()} on Horse #${horse}!`);
        }

        // --- 👑 ADMIN: START RACE ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.isOpen) return message.reply("⚠ Race already open.");

            system.isOpen = true;
            fs.writeJsonSync(BET_FILE, []);

            await broadcast(design("𝗕𝗘𝗧𝗧𝗜𝗡𝗚 𝗢𝗣𝗘𝗡", " 🏇 **𝖬𝖺𝗍𝖼𝗁:** 𝖦𝗅𝗈𝖻𝖺𝗅 𝖧𝗈𝗋𝗌𝖾 𝖱𝖺𝖼𝖾\n ⏳ **𝖳𝗂𝗆𝖾:** 2 𝖬𝗂𝗇𝗎𝗍𝖾𝗌\n 💰 **𝖬𝗎𝗅𝗍𝗂𝗉𝗅𝗂𝖾𝗋:** 3.0𝗑\n\n 👉 `!race bet [1-4] [amount]`"));

            system.timer = setTimeout(async () => {
                const bets = fs.readJsonSync(BET_FILE);
                if (bets.length === 0) {
                    system.isOpen = false;
                    return await broadcast(design("𝗖𝗔𝗡𝗖𝗘𝗟𝗟𝗘𝗗", " 🏟 𝖭𝗈 𝖻𝖾𝗍𝗌 𝗐𝖾𝗋𝖾 𝗉𝗅𝖺𝖼𝖾𝖽."));
                }

                await broadcast(design("𝗢𝗡𝗚𝗢𝗜𝗡𝗚", " 🏁 **𝗧𝗵𝗲 𝗵𝗼𝗿𝘀𝗲𝘀 𝗮𝗿𝗲 𝗼𝗳𝗳!**\n [ 🐎🏇🦓🦄        🏁 ]"));

                setTimeout(async () => {
                    const horses = ["Thunderbolt 🐎", "Star Dash 🏇", "Zebra King 🦓", "Mystic Soul 🦄"];
                    const winIdx = Math.floor(Math.random() * 4) + 1;
                    let winnersList = "";

                    for (const b of bets) {
                        if (b.horse === winIdx) {
                            const prize = b.amount * 3;
                            const u = await usersData.get(b.uid);
                            await usersData.set(b.uid, { money: (u.money || 0) + prize });
                            winnersList += ` • ${b.name}: +$${prize.toLocaleString()}\n`;
                        }
                    }

                    await broadcast(design("𝗥𝗔𝗖𝗘 𝗥𝗘𝗦𝗨𝗟𝗧", ` 🏆 **𝖶𝗂𝗇𝗇𝖾𝗋:** ${horses[winIdx-1]}\n\n 📜 **𝗣𝗮𝘆𝗼𝘂𝘁𝘀:**\n${winnersList || " 𝖭𝗈 𝗐𝗂𝗇𝗇𝖾𝗋𝗌."}`));
                    system.isOpen = false;
                    fs.writeJsonSync(BET_FILE, []);
                }, 5000);
            }, 120000);
            return;
        }
    }
};
