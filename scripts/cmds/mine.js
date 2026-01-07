const fs = require("fs-extra");
const path = require("path");

const JAIL_FILE = path.join(process.cwd(), "jailData.json");

if (!global.miningPlayers) global.miningPlayers = new Set();

module.exports = {
    config: {
        name: "mine",
        version: "1.5",
        author: "Gab Yu",
        countDown: 15,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, event, api, usersData }) {
        const { senderID, threadID } = event;
        
        const dirPath = path.join(__dirname, "..", "..", "data");
        const backpackPath = path.join(dirPath, "userBackpack.json");
        const itemsPath = path.join(dirPath, "userItems.json");

        if (!fs.existsSync(dirPath)) fs.ensureDirSync(dirPath);
        if (!fs.existsSync(backpackPath)) fs.writeJsonSync(backpackPath, {});

        const userData = await usersData.get(senderID);

        // 🛡️ SPAM / AUTO-ARREST LOGIC
        if (global.miningPlayers.has(senderID)) {
            const jailData = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
            const arrestTime = 30 * 60 * 1000; // 30 Minutes
            const fine = 5000;

            jailData[senderID] = {
                reason: "Spamming Mining Equipment",
                releaseAt: Date.now() + arrestTime
            };
            fs.writeJsonSync(JAIL_FILE, jailData);
            
            // Set money to negative (Fine)
            const currentMoney = userData.money || 0;
            await usersData.set(senderID, { money: currentMoney - fine });

            return message.reply(`👮 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧: 𝗦𝗣𝗔𝗠 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗**\n━━━━━━━━━━━━━━━━━━\nYou tried to bypass the mining cooldown! You are now **ARRESTED**.\n\n⏳ **Sentence:** 30 Mins\n💸 **Fine:** -$${fine.toLocaleString()}\n\n*Law enforcement has seized your equipment.*`);
        }

        // 🚫 PRISONER CHECK
        const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
        if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
            return message.reply("❌ Prisoners are not allowed to use mining equipment!");
        }

        // Register player as currently mining
        global.miningPlayers.add(senderID);

        // --- START ANIMATION ---
        const sent = await api.sendMessage("⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦...**\n━━━━━━━━━━━━━━━━━━\n`[░░░░░░░░░░]` 0%", threadID);

        const progressFrames = [
            { text: "`[▓▓░░░░░░░░]` 20%", status: "Checking the rocks..." },
            { text: "`[▓▓▓▓░░░░░░]` 40%", status: "Digging deeper..." },
            { text: "`[▓▓▓▓▓▓░░░░]` 60%", status: "Something is glowing!" },
            { text: "`[▓▓▓▓▓▓▓▓░░]` 80%", status: "Almost there..." },
            { text: "`[▓▓▓▓▓▓▓▓▓▓]` 100%", status: "Success!" }
        ];

        for (const frame of progressFrames) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            try {
                await api.editMessage(`⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦...**\n━━━━━━━━━━━━━━━━━━\n${frame.text}\n*Status: ${frame.status}*`, sent.messageID);
            } catch (e) {}
        }

        // --- REWARD LOGIC ---
        const rewards = [
            { name: "Coal", emoji: "⚫" },
            { name: "Iron", emoji: "⚪" },
            { name: "Gold", emoji: "🟡" },
            { name: "Diamond", emoji: "💎" }
        ];

        let hasLuckCharm = false;
        if (fs.existsSync(itemsPath)) {
            const itemsData = fs.readJsonSync(itemsPath);
            const userInv = itemsData[senderID] || [];
            hasLuckCharm = userInv.some(item => item.name.toLowerCase() === "luck charm");
        }

        let chance = Math.random();
        if (hasLuckCharm) chance += 0.2; 

        let selected = chance > 0.9 ? rewards[3] : chance > 0.7 ? rewards[2] : chance > 0.4 ? rewards[1] : rewards[0];

        // --- SAVE TO BACKPACK ---
        let backpack = fs.readJsonSync(backpackPath);
        if (!backpack[senderID]) backpack[senderID] = { Coal: 0, Iron: 0, Gold: 0, Diamond: 0 };
        
        backpack[senderID][selected.name]++;
        fs.writeJsonSync(backpackPath, backpack);

        // Unregister player
        global.miningPlayers.delete(senderID);

        // --- FINAL RESULT ---
        const luckLine = hasLuckCharm ? "\n✨ **You used your lucky charm!**" : "";
        const finalResult = `⛏️ **𝗠𝗜𝗡𝗜𝗡𝗚 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘**\n━━━━━━━━━━━━━━━━━━\nYou found: ${selected.emoji} **${selected.name}**\n\n📦 *Item stored in your backpack!*\n*Use !backpack to view or !backpack sell to cash out.*${luckLine}`;

        setTimeout(async () => {
            try {
                await api.editMessage(finalResult, sent.messageID);
            } catch (e) {
                api.sendMessage(finalResult, threadID);
            }
        }, 1000);
    }
};