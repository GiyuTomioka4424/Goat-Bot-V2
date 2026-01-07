const fs = require("fs-extra");
const path = require("path");

const SHOP_FILE = path.join(__dirname, "userItems.json");
const BANK_FILE = path.join(__dirname, "bankData.json");

if (!global.raffleSystem) {
    global.raffleSystem = {
        isOpen: false,
        participants: []
    };
}

module.exports = {
    config: {
        name: "raffle",
        version: "1.7",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "fun"
    },

    onStart: async function ({ message, args, event, api, usersData, permission }) {
        const { senderID, threadID } = event;
        const system = global.raffleSystem;

        // --- ACTION: START ---
        if (args[0] === "start") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (system.isOpen) return message.reply("⚠️ A raffle is already in progress.");

            system.isOpen = true;
            system.participants = [];

            try {
                const threads = await api.getThreadList(100, null, ["INBOX"]);
                const groupThreads = threads.filter(t => t.isGroup);
                
                groupThreads.forEach(g => {
                    api.sendMessage(
                        "🎫 **𝗠𝗔𝗖𝗞𝗬 𝗠𝗬𝗦𝗧𝗘𝗥𝗬 𝗥𝗔𝗙𝗙𝗟𝗘**\n━━━━━━━━━━━━━━━\n" +
                        "🎁 **𝗣𝗥𝗜𝗭𝗘𝗦:** [SECRET ITEMS & CASH]\n" +
                        "👥 **𝗪𝗶𝗻𝗻𝗲𝗿𝘀:** 4 Lucky Participants!\n\n" +
                        "👉 Type `!raffle join` to enter!", g.threadID);
                });
            } catch (err) {
                console.error("Broadcast Error:", err);
                return message.reply("📢 Raffle started, but global broadcast failed. You can still join in this GC!");
            }
            return;
        }

        // --- ACTION: JOIN ---
        if (args[0] === "join") {
            if (!system.isOpen) return message.reply("🏟️ The raffle is closed.");
            if (system.participants.some(p => p.uid === senderID)) return message.reply("❌ Already joined.");

            let name = await usersData.getName(senderID);
            if (!name || name.includes("Facebook")) name = `User ${senderID.slice(-4)}`;

            system.participants.push({ uid: senderID, name });
            return message.reply(`✅ **ENTRY CONFIRMED** (#${system.participants.length})`);
        }

        // --- ACTION: SPIN ---
        if (args[0] === "spin") {
            if (permission < 1) return message.reply("❌ Admins only.");
            if (!system.isOpen || system.participants.length < 4) return message.reply("⚠️ Need at least 4 players.");

            system.isOpen = false;
            let pool = [...system.participants].sort(() => Math.random() - 0.5);

            const winnersCash = pool.splice(0, 2);
            const winnersItem = pool.splice(0, 2);
            const mysteryItems = ["Arena VIP Pass", "Gold Miner Pickaxe", "Bank Shield", "Double Money Card"];
            
            // Process Cash Winners with Auto-Pay
            for (const w of winnersCash) {
                let prize = 20000000;
                const u = await usersData.get(w.uid);
                let currentMoney = u.money || 0;
                let bankData = fs.existsSync(BANK_FILE) ? fs.readJsonSync(BANK_FILE) : {};

                // ⚖️ Pay Bank Loan First
                if (bankData[w.uid] && bankData[w.uid].loan > 0) {
                    const toBank = Math.min(prize, bankData[w.uid].loan);
                    bankData[w.uid].loan -= toBank;
                    prize -= toBank;
                    fs.writeJsonSync(BANK_FILE, bankData, { spaces: 2 });
                }

                // ⚖️ Pay Arrest Fine (Negative Balance)
                if (prize > 0 && currentMoney < 0) {
                    const toFine = Math.min(prize, Math.abs(currentMoney));
                    currentMoney += toFine;
                    prize -= toFine;
                }

                await usersData.set(w.uid, { money: currentMoney + prize });
            }

            // Process Item Winners
            let inventory = fs.existsSync(SHOP_FILE) ? fs.readJsonSync(SHOP_FILE) : {};
            winnersItem.forEach(w => {
                const awardedItem = mysteryItems[Math.floor(Math.random() * mysteryItems.length)];
                if (!inventory[w.uid]) inventory[w.uid] = {};
                inventory[w.uid][awardedItem] = (inventory[w.uid][awardedItem] || 0) + 1;
                w.itemWon = awardedItem;
            });
            fs.writeJsonSync(SHOP_FILE, inventory, { spaces: 2 });

            const resultMsg = 
                "🏆 **𝗥𝗔𝗙𝗙𝗟𝗘 𝗥𝗘𝗦𝗨𝗟𝗧𝗦**\n━━━━━━━━━━━━━━━\n\n" +
                "💰 **₱20,000,000 CASH WINNERS:**\n" +
                `1. ${winnersCash[0].name}\n` +
                `2. ${winnersCash[1].name}\n\n` +
                "🎁 **MYSTERY ITEM WINNERS:**\n" +
                `1. ${winnersItem[0].name} (Won: ${winnersItem[0].itemWon})\n` +
