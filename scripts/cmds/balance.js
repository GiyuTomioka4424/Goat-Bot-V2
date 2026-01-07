const fs = require("fs-extra");
const path = require("path");
const JAIL_FILE = path.join(process.cwd(), "jailData.json");

module.exports = {
    config: {
        name: "balance",
        aliases: ["bal", "money"],
        version: "2.6",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        category: "economy"
    },

    onStart: async function ({ message, usersData, event, api }) {
        const { senderID, mentions, messageID } = event;
        const format = (num) => num.toLocaleString();
        const header = `💳 ➤ 𝗔𝗖𝗖𝗢𝗨𝗡𝗧 𝗕𝗔𝗟𝗔𝗡𝗖𝗘\n━━━━━━━━━━━━━━━\n`;
        const footer = `\n━━━━━━━━━━━━━━━\n🏛 𝖲𝖾𝖼𝗎𝗋𝖾 𝖣𝗂𝗀𝗂𝗍𝖺𝗅 𝖵𝖺𝗎𝗅`;

        if (fs.existsSync(JAIL_FILE)) {
            const jailList = fs.readJsonSync(JAIL_FILE);
            if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
                api.unsendMessage(messageID).catch(() => {});
                return message.reply(`⛓️ **ACCESS DENIED**\nPrisoners cannot access financial records.`);
            }
        }

        if (Object.keys(mentions).length > 0) {
            let msg = header;
            for (const uid in mentions) {
                const userMoney = await usersData.get(uid, "money") || 0;
                let name = await usersData.getName(uid);
                if (!name || name.includes("Facebook")) name = "User"; // Fix
                msg += `👤 ${name}\n💰 Cash: $${format(userMoney)}\n\n`;
            }
            return message.reply(msg.trim() + footer);
        }

        const userData = await usersData.get(senderID);
        const money = userData.money || 0;
        let senderName = await usersData.getName(senderID);
        if (!senderName || senderName.includes("Facebook")) senderName = "User"; // Fix

        let statusText = "📝 Active";
        let debtInfo = "";
        if (money < 0) {
            statusText = "🔴 IN DEBT";
            debtInfo = `\n📉 **Remaining Fine:** ₱${format(Math.abs(money))}`;
        } else if (money > 1000000) {
            statusText = "💎 Rich";
        }

        return message.reply(
            header +
            `👤 𝗨𝘀𝗲𝗿: ${senderName}\n` +
            `💰 𝗪𝗮𝗹𝗹𝗲𝘁: $${format(money)}\n` +
            `📊 𝗦𝘁𝗮𝘁𝘂𝘀: ${statusText}${debtInfo}` +
            footer
        );
    }
};