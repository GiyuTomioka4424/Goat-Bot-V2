const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const spamMap = new Map();

module.exports = {
    config: {
        name: "pnp",
        aliases: ["jail", "prison", "arrest"],
        version: "5.6",
        author: "Gab Yu",
        countDown: 2,
        role: 0, 
        category: "system"
    },

    // --- ⏰ AUTO-RELEASE MONITOR ---
    onLoad: async function ({ api, threadsData }) {
        setInterval(async () => {
            if (!fs.existsSync(PRISON_FILE)) return;
            let prisonList = fs.readJsonSync(PRISON_FILE);
            const now = Date.now();
            let changed = false;

            for (const id in prisonList) {
                if (now >= prisonList[id].releaseAt) {
                    const name = prisonList[id].name;
                    delete prisonList[id];
                    changed = true;
                    
                    const notice = `┏━━━━━━━━━━━━━━━━━━━━┓\n   🔓 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗟𝗘𝗔𝗦𝗘\n┗━━━━━━━━━━━━━━━━━━━━┛\n ❯ 𝖲𝗎𝗌𝗉𝖾𝖼𝗍: ${name}\n ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝖲𝖾𝗇𝗍𝖾𝗇𝖼𝖾 𝖲𝖾𝗋𝗏𝖾𝖽\n ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n ⚖️ 𝖥𝗎𝗅𝗅 𝖺𝖼𝖼𝖾𝗌𝗌 𝗋𝖾𝗌𝗍𝗈𝗋𝖾𝖽.`;
                    
                    const all = (await threadsData.getAll()).filter(t => t.isGroup);
                    for (const thread of all) { api.sendMessage(notice, thread.threadID); }
                }
            }
            if (changed) fs.writeJsonSync(PRISON_FILE, prisonList);
        }, 60000); 
    },

    // --- 👮 CHAT SPAM DETECTOR ---
    onChat: async function ({ event, usersData, api, threadsData }) {
        const { senderID, body } = event;
        const botID = api.getCurrentUserID();
        const now = Date.now();

        if (!body || senderID == botID || body.startsWith("┏━")) return;

        if (!fs.existsSync(PRISON_FILE)) fs.writeJsonSync(PRISON_FILE, {});
        let prisonList = fs.readJsonSync(PRISON_FILE);
        
        if (prisonList[senderID] && now < prisonList[senderID].releaseAt) return;

        if (!spamMap.has(senderID)) {
            spamMap.set(senderID, { count: 1, last: now });
            return;
        }

        const data = spamMap.get(senderID);
        if (now - data.last < 1200) data.count++; else data.count = 1;
        data.last = now;

        if (data.count > 5) { 
            const name = await usersData.getName(senderID) || `Suspect ${senderID}`;
            prisonList[senderID] = { name: name, releaseAt: now + (30 * 60000), reason: "Chat Spamming" };
            fs.writeJsonSync(PRISON_FILE, prisonList);
            spamMap.delete(senderID);

            const announcement = `┏━━━━━━━━━━━━━━━━━━━━┓\n   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧\n┗━━━━━━━━━━━━━━━━━━━━┛\n ❯ 𝖲𝗎𝗌𝗉𝖾𝖼𝗍: ${name}\n ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖲𝗉𝖺𝗆/𝖡𝗒𝗉𝖺𝗌𝗌\n ❯ 𝖲𝖾𝗇𝗍𝖾𝗇𝖼𝖾: 30 𝖬𝗂𝗇𝗎𝗍𝖾𝗌\n ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n 🚫 𝖲𝗒𝗌𝗍𝖾𝗆 𝖠𝖼𝖼𝖾𝗌𝗌 𝖲𝖾𝗂𝗓𝖾𝖽!`;
            
            const all = (await threadsData.getAll()).filter(t => t.isGroup);
            for (const thread of all) { api.sendMessage(announcement, thread.threadID); }
        }
    },

    // --- 🛠️ MANUAL PNP COMMANDS ---
    onStart: async function ({ message, args, event, permission, threadsData, api, usersData }) {
        const { mentions } = event;
        if (!fs.existsSync(PRISON_FILE)) fs.writeJsonSync(PRISON_FILE, {});
        let prisonList = fs.readJsonSync(PRISON_FILE);
        const now = Date.now();

        const action = args[0]?.toLowerCase();

        // 📋 !pnp list
        if (action === "list") {
            let msg = `┏━━━━━━━━━━━━━━━━━━━━┓\n   ⛓️ 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗗𝗜𝗥𝗘𝗖𝗧𝗢𝗥𝗬\n┗━━━━━━━━━━━━━━━━━━━━┛\n`;
            let count = 0;
            for (const id in prisonList) {
                const timeLeft = Math.round((prisonList[id].releaseAt - now) / 60000);
                if (timeLeft > 0) {
                    msg += ` 👤 **${prisonList[id].name}**\n ❯ 𝖴𝖨𝖣: ${id}\n ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: ${prisonList[id].reason || "Unknown"}\n ❯ 𝖫𝖾𝖿𝗍: ${timeLeft}𝗆\n ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
                    count++;
                }
            }
            if (count === 0) return message.reply("🏙️ **𝗖𝗜𝗧𝗬 𝗖𝗟𝗘𝗔𝗥:** No active warrants.");
            return message.reply(msg);
        }

        // 🔐 !pnp arrest @mention [time_in_mins] [reason]
        if (action === "arrest") {
            if (permission < 1) return message.reply("⚠️ **𝗔𝗨𝗧𝗛𝗢𝗥𝗜𝗧𝗬 𝗘𝗥𝗥𝗢𝗥:** Admin only.");
            
            let targetID = Object.keys(mentions)[0] || args[1];
            let timeArg = parseInt(args[2]) || 30; // Default 30 mins
            let reason = args.slice(3).join(" ") || "Manual Intervention";
            
            if (!targetID) return message.reply("❌ Usage: `!pnp arrest @mention [minutes] [reason]`");
            
            const name = await usersData.getName(targetID);
            prisonList[targetID] = { 
                name: name, 
                releaseAt: now + (timeArg * 60000), 
                reason: reason 
            };
            fs.writeJsonSync(PRISON_FILE, prisonList);

            const msg = `🚨 **𝗠𝗔𝗡𝗨𝗔𝗟 𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n👤 **Suspect:** ${name}\n⚖️ **Reason:** ${reason}\n⛓️ **Sentence:** ${timeArg} Minutes`;
            const all = (await threadsData.getAll()).filter(t => t.isGroup);
            for (const t of all) { api.sendMessage(msg, t.threadID); }
            return;
        }

        // 🔓 !pnp release @mention
        if (action === "release") {
            if (permission < 1) return message.reply("⚠️ **𝗔𝗨𝗧𝗛𝗢𝗥𝗜𝗧𝗬 𝗘𝗥𝗥𝗢𝗥:** Admin only.");
            let targetID = Object.keys(mentions)[0] || args[1];
            if (!targetID || !prisonList[targetID]) return message.reply("❌ User not found in prison.");

            const name = prisonList[targetID].name;
            delete prisonList[targetID];
            fs.writeJsonSync(PRISON_FILE, prisonList);

            return message.reply(`🔓 **𝗣𝗔𝗥𝗗𝗢𝗡 𝗚𝗥𝗔𝗡𝗧𝗘𝗗:** ${name} has been released.`);
        }

        return message.reply("❓ **𝗣𝗡𝗣 𝗛𝗘𝗟𝗣:**\n`!pnp list` - View inmates\n`!pnp arrest @mention [mins] [reason]`\n`!pnp release @mention` - Pardon user");
    }
};
