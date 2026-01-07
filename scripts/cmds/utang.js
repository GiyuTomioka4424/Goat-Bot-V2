const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "debtors",
        aliases: ["loanlist", "utang"],
        version: "1.2",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "economy",
        guide: {
            en: "{pn}"
        }
    },

    onStart: async function ({ message, usersData, event }) {
        const BANK_FILE = path.join(__dirname, "bankData.json");

        if (!fs.existsSync(BANK_FILE)) {
            return message.reply("📑 𝗡𝗼 𝗯𝗮𝗻𝗸 𝗿𝗲𝗰𝗼𝗿𝗱𝘀 𝗳𝗼𝘂𝗻𝗱.");
        }

        const bankData = JSON.parse(fs.readFileSync(BANK_FILE, "utf8"));
        const debtorIDs = Object.keys(bankData).filter(id => bankData[id].loan > 0);

        if (debtorIDs.length === 0) {
            return message.reply("✨ 𝗖𝗟𝗘𝗔𝗡 𝗥𝗘𝗖𝗢𝗥𝗗: 𝖭𝗈 𝗈𝗇𝖾 𝖼𝗎𝗋𝗋𝖾𝗇𝗍𝗅𝗒 𝗈𝗐𝖾𝗌 𝗆𝗈𝗇𝖾𝗒 𝗍𝗈 𝖬𝖺𝖼𝗄𝗒 𝖡𝖺𝗇𝗄.");
        }

        // Sort by highest loan amount
        debtorIDs.sort((a, b) => bankData[b].loan - bankData[a].loan);

        let list = "🏛️ 𝗠𝗔𝗖𝗞𝗬 𝗕𝗔𝗡𝗞: 𝗖𝗥𝗘𝗗𝗜𝗧 𝗪𝗔𝗧𝗖𝗛\n";
        list += "━━━━━━━━━━━━━━━━━━━\n";
        list += "💡 𝖫𝗈𝖺𝗇𝗌 𝗈𝗏𝖾𝗋 **$50,000** = 🚫 𝗚𝗔𝗠𝗘 𝗕𝗔𝗡\n\n";

        for (let i = 0; i < debtorIDs.length; i++) {
            const id = debtorIDs[i];
            const name = await usersData.getName(id);
            const loanAmount = bankData[id].loan;
            
            // Logic for the ban indicator
            const status = loanAmount > 50000 ? "🚫 𝗕𝗔𝗡𝗡𝗘𝗗" : "✅ 𝗪𝗔𝗥𝗡𝗜𝗡𝗚";
            const fontName = loanAmount > 50000 ? `⚠️ ${name.toUpperCase()}` : `👤 ${name}`;

            list += `${i + 1}. ${fontName}\n`;
            list += `   💰 𝗗𝗲𝗯𝘁: $${loanAmount.toLocaleString()}\n`;
            list += `   📊 𝗦𝘁𝗮𝘁𝘂𝘀: ${status}\n\n`;
        }

        list += "━━━━━━━━━━━━━━━━━━━\n";
        list += "📝 𝖯𝖺𝗒 𝗒𝗈𝗎𝗋 𝖽𝗎𝖾𝗌 𝗍𝗈 𝗅𝗂𝖿𝗍 𝗀𝖺𝗆𝗂𝗇𝗀 𝗋𝖾𝗌𝗍𝗋𝗂𝖼𝗍𝗂𝗈𝗇𝗌.";

        return message.reply(list);
    }
};