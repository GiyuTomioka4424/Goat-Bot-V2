const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const BANK_FILE = path.join(__dirname, "cache", "bankData.json");

module.exports = {
    config: {
        name: "help",
        version: "3.2",
        author: "Gab Yu", // 👑 Updated to your name
        countDown: 5,
        role: 0,
        category: "system"
    },

    onStart: async function ({ message, args, event, api, usersData, permission }) {
        const { commands } = global.GoatBot;
        const { senderID } = event;
        const now = Date.now();
        
        // 👑 AUTHOR/OWNER BYPASS
        // This ensures the creator (Gab Yu) and Admins aren't blocked by their own laws.
        const isOwner = permission >= 2;

        // --- 🚨 MACKY PNP RESTRICTION GUARD ---
        if (!isOwner && fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(
                    `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
                    `   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡\n` +
                    `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
                    `  ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗\n` +
                    `  ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖠𝖼𝗍𝗂𝗏𝖾 𝖶𝖺𝗋𝗋𝖺𝗇𝗍\n` +
                    ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
                    ` ⚖️ 𝖢𝗈𝗆𝗆𝖺𝗇𝖽 𝗉𝗋𝗂𝗏𝗂𝗅𝖾𝗀𝖾𝗌 𝗋𝖾𝗏𝗈𝗄𝖾𝖽.`
                );
            }
        }

        // --- 💰 LOAN CHECK (GAMBLING BAN) ---
        let hasLoan = false;
        if (!isOwner && fs.existsSync(BANK_FILE)) {
            const bankData = fs.readJsonSync(BANK_FILE);
            if (bankData[senderID] && bankData[senderID].loan > 0) hasLoan = true;
        }

        const design = (title, body) => 
            `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
            `      𝗠𝗔𝗖𝗞𝗬 𝗛𝗘𝗟𝗣 𝗗𝗜𝗥𝗘𝗖𝗧𝗢𝗥𝗬\n` +
            `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
            ` ❯ 𝖢𝖺𝗍𝖾𝗀𝗈𝗋𝗒: ${title}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            `${body}\n` +
            ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            ` 💡 𝖴𝗌𝖾 !𝗁𝖾𝗅𝗉 [𝗇𝖺𝗆𝖾] 𝖿𝗈𝗋 𝗂𝗇𝖿𝗈.`;

        // --- SINGLE COMMAND VIEW ---
        if (args[0]) {
            const cmd = commands.get(args[0].toLowerCase());
            if (!cmd) return message.reply("❌ Command not found in the Macky Database.");

            const { config } = cmd;
            let detail = 
                ` • 𝗡𝗮𝗺𝗲: ${config.name}\n` +
                ` • 𝗔𝘂𝘁𝗵𝗼𝗿: ${config.author || "Unknown"}\n` +
                ` • 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${config.countDown}𝗌\n` +
                ` • 𝗥𝗼𝗹𝗲: ${config.role == 2 ? "Admin" : config.role == 1 ? "Moderator" : "User"}\n` +
                ` • 𝗨𝘀𝗮𝗴𝗲: ${config.guide?.en || "No guide"}`;
            
            return message.reply(design("𝗗𝗘𝗧𝗔𝗜𝗟𝗦", detail));
        }

        // --- FULL MENU VIEW ---
        const categories = {};
        commands.forEach((cmd) => {
            const cat = cmd.config.category || "General";

            // Regular users with loans cannot see games/economy (except bank)
            if (!isOwner && hasLoan && (cat.toLowerCase() === "game" || cat.toLowerCase() === "economy")) {
                if (cmd.config.name !== "bank" && cmd.config.name !== "dhbc") return;
            }

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.config.name);
        });

        let listMsg = isOwner ? `⭐ **𝗔𝗨𝗧𝗛𝗢𝗥 𝗣𝗥𝗜𝗩𝗜𝗟𝗘𝗚𝗘 𝗔𝗖𝗧𝗜𝗩𝗘**\n\n` : "";
        for (const [category, cmds] of Object.entries(categories)) {
            listMsg += ` 📂 **${category.toUpperCase()}**\n ↳ ${cmds.join(", ")}\n\n`;
        }

        if (!isOwner && hasLoan) {
            listMsg += ` ⚠️ **𝗗𝗘𝗕𝗧 𝗔𝗟𝗘𝗥𝗧:**\n 𝖦𝖺𝗆𝖻𝗅𝗂𝗇𝗀 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌 𝗁𝗂𝖽𝖽𝖾𝗇 𝖽𝗎𝖾 𝗍𝗈 𝖺𝖼𝗍𝗂𝗏𝖾 𝗅𝗈𝖺𝗇!`;
        }

        return message.reply(design("𝗔𝗟𝗟 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦", listMsg.trim()));
    }
};