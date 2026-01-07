const fs = require("fs-extra");
const path = require("path");

const BANK_FILE = path.join(__dirname, "../../commands/cache/bankData.json");

module.exports = {
    config: {
        name: "economyManager",
        author: "Gab Yu",
        version: "1.0.0"
    },

    onLoad: function () {
        // This runs every 1 hour to increase loan debt automatically
        setInterval(() => {
            if (fs.existsSync(BANK_FILE)) {
                const bankData = fs.readJsonSync(BANK_FILE);
                let updated = false;

                for (const uid in bankData) {
                    if (bankData[uid].loan > 0) {
                        // 1% Interest per hour
                        bankData[uid].loan += Math.floor(bankData[uid].loan * 0.01);
                        updated = true;
                    }
                }

                if (updated) fs.writeJsonSync(BANK_FILE, bankData);
            }
        }, 3600000); // 1 hour in milliseconds
    },

    onEvent: async function ({ api, event, usersData }) {
        const { type, logMessageData, threadID } = event;

        // --- RULE: WELCOME WARNING ---
        // If a new member joins, check if they are a "High-Risk Debtor" or "Prisoner"
        if (type === "log:subscribe") {
            const newID = logMessageData.addedParticipants[0].userFbId;
            const name = await usersData.getName(newID);
            
            if (fs.existsSync(BANK_FILE)) {
                const bankData = fs.readJsonSync(BANK_FILE);
                if (bankData[newID] && bankData[newID].loan > 0) {
                    return api.sendMessage(
                        `⚠️ 𝗛𝗜𝗚𝗛-𝗥𝗜𝗦𝗞 𝗔𝗟𝗘𝗥𝗧\n━━━━━━━━━━━━━━━\n` +
                        `👤 Member: ${name}\n` +
                        `📉 Status: Unpaid Bank Loan\n` +
                        `🚫 Note: Gambling commands are disabled for this user until debt is cleared.`, 
                        threadID
                    );
                }
            }
        }
    }
};
