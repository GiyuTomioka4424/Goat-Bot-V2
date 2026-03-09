const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const backpackPath = path.join(process.cwd(), "userBackpack.json");
const itemsPath = path.join(process.cwd(), "userItems.json");

if (!global.miningPlayers) global.miningPlayers = new Set();
const spamTracker = new Map();

module.exports = {
    config: {
        name: "mine",
        version: "2.1",
        author: "Gab Yu",
        countDown: 15,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, event, api, usersData, threadsData }) {
        const { senderID, threadID } = event;
        const now = Date.now();
        
        if (!fs.existsSync(backpackPath)) fs.writeJsonSync(backpackPath, {});
        const userData = await usersData.get(senderID);

        // --- 🚔 AUTO-ARREST SPAM MONITOR ---
        const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
        if (now - userSpam.last < 1500) { 
            userSpam.count++;
            if (userSpam.count >= 4) {
                let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
                const penaltyFine = 10000;
                prisonList[senderID] = { 
                    name: userData.name || "Miner",
                    releaseAt: now + (30 * 60 * 1000), 
                    reason: "Mining Equipment Sabotage (Spamming)" 
                };
                fs.writeJsonSync(PRISON_FILE, prisonList);
                await usersData.set(senderID, { money: (userData.money || 0) - penaltyFine }); 
                spamTracker.delete(senderID);

                const announcement = `┏━━━━━━━━━━━━━━━━━━━━┓\n   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧\n┗━━━━━━━━━━━━━━━━━━━━┛\n ❯ 𝖲𝗎𝗌𝗉𝖾𝖼𝗍: ${userData.name}\n ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖬𝗂𝗇𝗂𝗇𝗀 𝖲𝗉𝖺𝗆\n ❯ 𝖥𝗂𝗇𝖾: $${penaltyFine.toLocaleString()}\n ❯ 𝖲𝖾𝗇𝗍𝖾𝗇𝖼𝖾: 30 𝖬𝗂𝗇𝗎𝗍𝖾𝗌`;
                const allThreads = (await threadsData.getAll()).filter(t => t.isGroup);
                for (const thread of allThreads) { api.sendMessage(announcement, thread.threadID); }
                return;
            }
        } else { userSpam.count = 0; }
        userSpam.last = now;
        spamTracker.set(senderID, userSpam);

        // --- 🚨 MACKY PNP RESTRICTION GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(`┏━━━━━━━━━━━━━━━━━━━━┓\n   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡\n┗━━━━━━━━━━━━━━━━━━━━┛\n ⚖️ 𝖫𝖺𝖻𝗈𝗋 𝗉𝗋𝗂𝗏𝗂𝗅𝖾𝗀𝖾𝗌 𝗌𝖾𝗂𝗓𝖾𝖽.`);
            }
        }

        // --- 🛒 SARI-SARI ITEM CHECK ---
        let inventory = fs.existsSync(itemsPath) ? fs.readJsonSync(itemsPath) : {};
        let userInv = inventory[senderID] || {};
        
        if (!userInv["Iron Pickaxe"] || userInv["Iron Pickaxe"] <= 0) {
            return message.reply("❌ **𝗠𝗜𝗦𝗦𝗜𝗡𝗚 𝗧𝗢𝗢𝗟**\nYou need an **Iron Pickaxe** to mine! Buy one at the `!sarisari` store first.");
        }

        if (global.miningPlayers.has(senderID)) {
            return message.reply("⚠️ You are already digging! Wait for your current session to finish.");
        }

        global.miningPlayers.add(senderID);

        // --- ⛏️ START ANIMATION ---
        const sent = await api.sendMessage("⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦...**\n━━━━━━━━━━━━━━━━━━\n`[░░░░░░░░░░]` 0%", threadID);

        const progressFrames = [
            { text: "`[▓▓░░░░░░░░]` 20%", status: "Checking the rocks..." },
            { text: "`[▓▓▓▓░░░░░░]` 40%", status: "Digging deeper..." },
            { text: "`[▓▓▓▓▓▓░░░░]` 60%", status: "Something is glowing!" },
            { text: "`[▓▓▓▓▓▓▓▓░░]` 80%", status: "Almost there..." },
            { text: "`[▓▓▓▓▓▓▓▓▓▓]` 100%", status: "Success!" }
        ];

        for (const frame of progressFrames) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            try {
                await api.editMessage(`⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦...**\n━━━━━━━━━━━━━━━━━━\n${frame.text}\n*Status: ${frame.status}*`, sent.messageID);
            } catch (e) {}
        }

        // --- 💎 LUCK CHARM & REWARD LOGIC ---
        let hasLuckCharm = userInv["Luck Charm"] > 0;
        let usedCharm = false;
        const rewards = [
            { name: "Coal", emoji: "⚫", value: 100 },
            { name: "Iron", emoji: "⚪", value: 500 },
            { name: "Gold", emoji: "🟡", value: 2500 },
            { name: "Diamond", emoji: "💎", value: 10000 }
        ];

        let chance = Math.random();
        if (hasLuckCharm) {
            chance += 0.15; // 15% Luck Boost
            userInv["Luck Charm"] -= 1; // 1x CONSUMPTION per mine
            inventory[senderID] = userInv;
            fs.writeJsonSync(itemsPath, inventory);
            usedCharm = true;
        }

        // Determine reward based on chance
        let itemFound;
        if (chance > 0.95) itemFound = rewards[3];
        else if (chance > 0.80) itemFound = rewards[2];
        else if (chance > 0.50) itemFound = rewards[1];
        else itemFound = rewards[0];

        // Save to Backpack
        let backpack = fs.readJsonSync(backpackPath);
        if (!backpack[senderID]) backpack[senderID] = {};
        backpack[senderID][itemFound.name] = (backpack[senderID][itemFound.name] || 0) + 1;
        fs.writeJsonSync(backpackPath, backpack);

        global.miningPlayers.delete(senderID);

        return api.editMessage(
            `⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘**\n━━━━━━━━━━━━━━━━━━\n` +
            `🎁 **Found:** ${itemFound.emoji} ${itemFound.name}\n` +
            `${usedCharm ? "🍀 **Luck Charm:** Consumed (15% Boost Applied)" : "🛡️ **Luck Charm:** None used"}\n` +
            `📦 *Stored in !backpack*`, sent.messageID
        );
    }
};
