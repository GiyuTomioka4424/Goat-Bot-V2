const fs = require("fs-extra");
const path = require("path");

// FIXED: Using process.cwd() for global synchronization
const ITEM_FILE = path.join(process.cwd(), "userItems.json");
const BANK_FILE = path.join(process.cwd(), "cache", "bankData.json");
const PRISON_FILE = path.join(process.cwd(), "prisonData.json");

if (!global.raffleSystem) {
    global.raffleSystem = {
        isOpen: false,
        participants: []
    };
}

module.exports = {
    config: {
        name: "raffle",
        version: "1.8",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "fun"
    },

    onStart: async function ({ message, args, event, api, usersData, permission, threadsData }) {
        const { senderID, threadID } = event;
        const system = global.raffleSystem;
        const now = Date.now();

        // --- 🚨 MACKY PNP GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply("🚨 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗:** Prisoners cannot enter raffles!");
            }
        }

        const design = (status, body) =>
            `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
            `     𝗠𝗔𝗖𝗞𝗬 𝗦𝗬𝗦𝗧𝗘𝗠 𝗥𝗔𝗙𝗙𝗟𝗘\n` +
            `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
            ` ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: ${status}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            `${body}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

        const broadcast = async (content) => {
            const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
            for (const thread of allThreads) {
                api.sendMessage(content, thread.threadID);
            }
        };

        // --- 🟢 ADMIN: START ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.isOpen) return message.reply("⚠️ Raffle is already open.");

            system.isOpen = true;
            system.participants = [];

            await broadcast(design("𝗕𝗘𝗧𝗧𝗜𝗡𝗚 𝗢𝗣𝗘𝗡", 
                " 🎁 **Prizes:** $20M Cash & Rare Items\n" +
                " 👥 **Winners:** 4 Lucky Players\n\n" +
                " 👉 Type `!raffle join` to enter!"));
            return;
        }

        // --- 📥 PLAYER: JOIN ---
        if (args[0] === "join") {
            if (!system.isOpen) return message.reply("🏟️ Raffle is closed.");
            if (system.participants.some(p => p.uid === senderID)) return message.reply("❌ Already joined.");

            // LOAN CHECK
            const bankData = fs.existsSync(BANK_FILE) ? fs.readJsonSync(BANK_FILE) : {};
            if (bankData[senderID] && bankData[senderID].loan > 0) {
                return message.reply("🚫 **𝗟𝗢𝗔𝗡 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗:** Pay your debt before joining!");
            }

            const name = await usersData.getName(senderID);
            system.participants.push({ uid: senderID, name: name });
            return message.reply(`✅ **ENTRY CONFIRMED** (Ticket #${system.participants.length})`);
        }

        // --- 🎡 ADMIN: SPIN ---
        if (args[0] === "spin") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (!system.isOpen || system.participants.length < 4) return message.reply("⚠️ Need at least 4 players.");

            system.isOpen = false;
            let pool = [...system.participants].sort(() => Math.random() - 0.5);

            const winnersCash = pool.splice(0, 2);
            const winnersItem = pool.splice(0, 2);
            const mysteryItems = ["Arena VIP Pass", "Iron Pickaxe", "Luck Charm", "Vault Key"];

            // 1. Process Cash Winners ($20M)
            let cashResults = "";
            for (const w of winnersCash) {
                const prize = 20000000;
                const u = await usersData.get(w.uid);
                await usersData.set(w.uid, { money: (u.money || 0) + prize });
                cashResults += ` • ${w.name}: +$20,000,000\n`;
            }

            // 2. Process Item Winners
            let itemResults = "";
            let inventory = fs.existsSync(ITEM_FILE) ? fs.readJsonSync(ITEM_FILE) : {};
            
            for (const w of winnersItem) {
                const item = mysteryItems[Math.floor(Math.random() * mysteryItems.length)];
                if (!inventory[w.uid]) inventory[w.uid] = {};
                inventory[w.uid][item] = (inventory[w.uid][item] || 0) + 1;
                itemResults += ` • ${w.name}: [ ${item} ]\n`;
            }
            fs.writeJsonSync(ITEM_FILE, inventory);

            await broadcast(design("𝗥𝗔𝗙𝗙𝗟𝗘 𝗥𝗘𝗦𝗨𝗟𝗧𝗦", 
                `💰 **CASH WINNERS:**\n${cashResults}\n` +
                `🎁 **ITEM WINNERS:**\n${itemResults}`));
            
            system.participants = [];
            return;
        }

        return message.reply("❓ `!raffle join` or Admin: `!raffle start/spin`.");
    }
};
