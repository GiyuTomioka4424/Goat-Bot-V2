const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "help",
        version: "2.0",
        author: "Gemini",
        countDown: 5,
        role: 0,
        category: "system",
        guide: { en: "{pn} [command name]" }
    },

    onStart: async function ({ message, args, event, usersData }) {
        const { commands } = global.GoatBot;
        const { senderID } = event;
        const bankPath = path.join(__dirname, "cache", "bankData.json");

        // --- 1. LOAN CHECK FOR GAMBLING BAN ---
        let hasLoan = false;
        if (fs.existsSync(bankPath)) {
            const bankData = fs.readJsonSync(bankPath);
            if (bankData[senderID] && bankData[senderID].loan > 0) hasLoan = true;
        }

        const design = (title, body) => 
            `╔════════════════════╗\n` +
            `    📜  𝗠𝗔𝗖𝗞𝗬 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨\n` +
            `╚════════════════════╝\n` +
            ` ➤ 𝖢𝖺𝗍𝖾𝗀𝗈𝗋𝗒: ${title}\n` +
            `────────────────────\n` +
            `${body}\n` +
            `────────────────────\n` +
            `💡 𝖳𝗒𝗉𝖾 !𝗁𝖾𝗅𝗉 [𝗇𝖺𝗆𝖾] 𝖿𝗈𝗋 𝖽𝖾𝗍𝖺𝗂𝗅𝗌`;

        // --- 2. SINGLE COMMAND DETAIL ---
        if (args[0]) {
            const command = commands.get(args[0].toLowerCase());
            if (!command) return message.reply(`❌ Command "${args[0]}" not found.`);
            
            const config = command.config;
            let detail = ` 🏷️ 𝗡𝗮𝗺𝗲: ${config.name}\n` +
                         ` 📋 𝗗𝗲𝘀𝗰: ${config.description.en || config.description}\n` +
                         ` ⏱️ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${config.countDown}s\n` +
                         ` 🔑 𝗥𝗼𝗹𝗲: ${config.role == 2 ? "Admin" : "User"}\n` +
                         ` 📖 𝗨𝘀𝗮𝗴𝗲: ${config.guide?.en || "No guide available"}`;
            return message.reply(design("COMMAND DETAILS", detail));
        }

        // --- 3. FULL COMMAND LIST ---
        const categories = {};
        commands.forEach((cmd) => {
            const cat = cmd.config.category || "Uncategorized";
            
            // Apply your Rule: Hide gambling games if they have a loan
            if (hasLoan && (cat.toLowerCase() === "game" || cat.toLowerCase() === "economy")) {
                // We keep 'bank' visible so they can pay the loan, but hide others
                if (cmd.config.name !== "bank" && cmd.config.name !== "dhbc") return;
            }

            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.config.name);
        });

        let listMsg = "";
        for (const [category, cmds] of Object.entries(categories)) {
            listMsg += `📂 𝗧𝗼𝗽𝗶𝗰: ${category.toUpperCase()}\n`;
            listMsg += `» ${cmds.join(", ")}\n\n`;
        }

        if (hasLoan) {
            listMsg += `⚠️ 𝗡𝗼𝘁𝗲: Some games are hidden because you have an active loan! Pay it via !bank pay to unlock them.`;
        }

        return message.reply(design("ALL COMMANDS", listMsg));
    }
};
