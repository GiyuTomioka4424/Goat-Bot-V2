const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "top",
        aliases: ["leaderboard", "richest"],
        version: "1.6.1",
        author: "Gab Yu",
        countDown: 10,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, usersData }) {
        // Path corrected to match your bank system
        const BANK_FILE = path.join(__dirname, "cache", "bankData.json");
        
        if (!fs.existsSync(BANK_FILE)) return message.reply("❌ No bank records found yet.");

        const bankData = fs.readJsonSync(BANK_FILE);
        const allUsers = await usersData.getAll();
        
        let leaderboard = await Promise.all(allUsers.map(async (user) => {
            const userBank = bankData[user.userID]?.bank || 0;
            const userLoan = bankData[user.userID]?.loan || 0;
            const userWallet = user.money || 0;
            
            // Net Worth = Wallet + Bank - Unpaid Loans
            const netWorth = (userWallet + userBank) - userLoan;
            
            let name = await usersData.getName(user.userID);
            if (!name || name.includes("Facebook")) {
                name = `User ${user.userID.slice(-4)}`;
            }

            return {
                name: name,
                total: netWorth
            };
        }));

        // Sort by net worth
        leaderboard.sort((a, b) => b.total - a.total);
        const top15 = leaderboard.slice(0, 15);

        let msg = `🏆 𝗠𝗔𝗖𝗞𝗬 𝗥𝗜𝗖𝗛 𝗟𝗜𝗦𝗧: 𝗧𝗢𝗣 𝟭𝟱\n`;
        msg += `──────────────────\n\n`;

        top15.forEach((player, index) => {
            let rankDisplay;
            const rank = index + 1;

            if (rank === 1) rankDisplay = "🥇 1𝗌𝗍";
            else if (rank === 2) rankDisplay = "🥈 2𝗇𝖽";
            else if (rank === 3) rankDisplay = "🥉 3𝗋𝖽";
            else rankDisplay = `👤 ${rank}𝗍𝗁`;

            msg += `${rankDisplay} | **${player.name}**\n`;
            let totalDisplay = player.total >= Infinity ? "∞" : player.total.toLocaleString();
            msg += `💰 $${totalDisplay}\n\n`;
        });

        msg += `──────────────────\n`;
        msg += `✨ 𝖪𝖾𝖾𝗉 𝗀𝗋𝗂𝗇𝖽𝗂𝗇𝗀 𝗍𝗈 𝗋𝖾𝖺𝖼𝗁 𝗍𝗁𝖾 𝗍𝗈𝗉!`;

        return message.reply(msg);
    }
};
