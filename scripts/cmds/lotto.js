const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const LOTTO_FILE = path.join(process.cwd(), "lottoData.json");

if (!global.lottoSystem) {
    global.lottoSystem = {
        jackpot: 50000000, // Starts at $50M
        isOpen: false
    };
}

module.exports = {
    config: {
        name: "lotto",
        version: "4.2",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "gambling"
    },

    onStart: async function ({ message, args, event, api, usersData, permission, threadsData }) {
        const { senderID } = event;
        const system = global.lottoSystem;
        const now = Date.now();

        const design = (status, body) =>
            `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
            `      𝗠𝗔𝗖𝗞𝗬 𝗚𝗟𝗢𝗕𝗔𝗟 𝗟𝗢𝗧𝗧𝗢\n` +
            `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
            ` ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: ${status}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            `${body}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

        const broadcast = async (content) => {
            const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
            for (const thread of allThreads) { api.sendMessage(content, thread.threadID); }
        };

        // --- 🚨 MACKY PNP & BANK GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(design("𝖠𝖼𝖼𝖾𝗌𝗌 𝖣𝖾𝗇𝗂𝖾𝖽", " 🚨 **𝗪𝗔𝗥𝗥𝗔𝗡𝗧 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗**\n Prisoners cannot play lotto."));
            }
        }

        if (fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            if (bankData[senderID] && bankData[senderID].loan > 0) {
                return message.reply(design("𝖠𝖼𝖼𝖾𝗌𝗌 𝖣𝖾𝗇𝗂𝖾𝖽", " 🚫 **𝗟𝗢𝗔𝗡 𝗕𝗔𝗡:** Pay your bank\ndebt to buy tickets!"));
            }
        }

        // --- 🟢 ADMIN: START ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.isOpen) return message.reply("⚠️ Lotto is already open.");

            system.isOpen = true;
            fs.writeJsonSync(LOTTO_FILE, []);
            await broadcast(design("𝗧𝗜𝗖𝗞𝗘𝗧𝗦 𝗢𝗣𝗘𝗡", ` 💰 **𝖩𝖺𝖼𝗄𝗉𝗈𝗍:** $${system.jackpot.toLocaleString()}\n 🎫 **𝖯𝗋𝗂𝖼𝖾:** $50,000 / Ticket\n\n 👉 \`!lotto buy [1-99]\``));
            return;
        }

        // --- 📥 PLAYER: BUY ---
        if (args[0] === "buy") {
            if (!system.isOpen) return message.reply("🏟️ The Lotto terminal is closed.");
            const num = parseInt(args[1]);
            if (isNaN(num) || num < 1 || num > 99) return message.reply("❌ Pick a number between 1 and 99.");

            const uData = await usersData.get(senderID);
            if (uData.money < 50000) return message.reply("💸 Tickets cost $50,000.");

            await usersData.set(senderID, { money: uData.money - 50000 });
            system.jackpot += 10000; // Each ticket adds to jackpot
            
            let players = fs.existsSync(LOTTO_FILE) ? fs.readJsonSync(LOTTO_FILE) : [];
            players.push({ uid: senderID, name: uData.name, pick: num });
            fs.writeJsonSync(LOTTO_FILE, players);

            return message.reply(`✅ **𝗧𝗜𝗖𝗞𝗘𝗧 𝗕𝗢𝗨𝗚𝗛𝗧:** Number **${num}**!`);
        }

        // --- 🎡 ADMIN: DRAW ---
        if (args[0] === "draw") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (!system.isOpen) return message.reply("⚠️ No active lotto to draw.");

            const winningNum = Math.floor(Math.random() * 99) + 1;
            const players = fs.readJsonSync(LOTTO_FILE);
            const winners = players.filter(p => p.pick === winningNum);

            let resultMsg = ` 🎰 **𝖶𝗂𝗇𝗇𝗂𝗇𝗀 𝖭𝗎𝗆𝖻𝖾𝗋:** ${winningNum}\n\n`;

            if (winners.length > 0) {
                const share = Math.floor(system.jackpot / winners.length);
                for (const w of winners) {
                    const u = await usersData.get(w.uid);
                    await usersData.set(w.uid, { money: (u.money || 0) + share });
                }
                resultMsg += ` 🏆 **𝗪𝗶𝗻𝗻𝗲𝗿𝘀:** ${winners.length}\n 💰 **𝗘𝗮𝗰𝗵 𝗪𝗼𝗻:** $${share.toLocaleString()}`;
                system.jackpot = 50000000; // Reset
            } else {
                resultMsg += ` 🕯️ **𝖭𝗈 𝖶𝗂𝗇𝗇𝖾𝗋𝗌.**\n 📈 **𝖩𝖺𝖼𝗄𝗉𝗈𝗍 𝖱𝗈𝗅𝗅𝗈𝗏𝖾𝗋:** $${system.jackpot.toLocaleString()}`;
            }

            await broadcast(design("𝗗𝗥𝗔𝗪 𝗥𝗘𝗦𝗨𝗟𝗧𝗦", resultMsg));
            system.isOpen = false;
            return;
        }

        return message.reply("❓ `!lotto buy [1-99]` or Admin: `!lotto start/draw`.");
    }
};
