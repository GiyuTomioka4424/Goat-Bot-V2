const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");

module.exports = {
    config: {
        name: "daily",
        version: "2.1",
        author: "Gab Yu",
        countDown: 5,
        role: 0,
        description: { en: "Claim your daily rewards with wealth scaling" },
        category: "game",
        envConfig: {
            rewardFirstDay: { coin: 5000, exp: 100 }
        }
    },

    onStart: async function ({ args, message, event, envCommands, usersData, commandName }) {
        const { senderID } = event;
        const now = Date.now();

        // --- 🚨 MACKY PNP RESTRICTION GUARD ---
        if (fs.existsSync(PRISON_FILE)) {
            const prisonList = fs.readJsonSync(PRISON_FILE);
            if (prisonList[senderID] && now < prisonList[senderID].releaseAt) {
                return message.reply(
                    `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
                    `   🚨 𝗠𝗔𝗖𝗞𝗬 𝗣𝗡𝗣 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗜𝗢𝗡\n` +
                    `┗━━━━━━━━━━━━━━━━━━━━┛\n` +
                    `  ❯ 𝖲𝗍𝖺𝗍𝗎𝗌: 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗\n` +
                    `  ❯ 𝖱𝖾𝖺𝗌𝗈𝗇: 𝖠𝖼𝗍𝗂𝗏𝖾 𝖶𝖺𝗋𝗋𝖺𝗇𝗍\n` +
                    ` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
                    ` ⚖️ 𝖣𝖺𝗂𝗅𝗒 𝖻𝖾𝗇𝖾𝖿𝗂𝗍𝗌 𝗁𝖺𝗏𝖾 𝖻𝖾𝖾𝗇 𝖿𝗋𝗈𝗓𝖾𝗇.`
                );
            }
        }

        const reward = envCommands[commandName].rewardFirstDay;
        const userData = await usersData.get(senderID);
        const currentMoney = userData.money || 0;

        // 📅 Date Check (Manila Time)
        const dateTime = moment.tz("Asia/Manila").format("DD/MM/YYYY");
        if (userData.data && userData.data.lastTimeGetReward === dateTime) {
            return message.reply("📋 **𝗗𝗔𝗜𝗟𝗬 𝗦𝗧𝗔𝗧𝗨𝗦**\nYou have already collected your gift for today. Come back tomorrow! 🕒");
        }

        // 💰 Wealth Scaling Logic
        const wealthBonus = Math.min(Math.floor(currentMoney * 0.05), 1000000);
        const baseCoin = reward.coin;
        const baseExp = reward.exp;

        // 🍀 Luck Charm Check (Saved Instruction)
        let luckBonus = 0;
        if (userData.backpack && userData.backpack.some(i => i.name.toLowerCase() === "luck charm")) {
            luckBonus = 10000;
        }

        const totalCoin = baseCoin + wealthBonus + luckBonus;
        const totalExp = baseExp;

        // Update Data
        if (!userData.data) userData.data = {};
        userData.data.lastTimeGetReward = dateTime;

        await usersData.set(senderID, {
            money: currentMoney + totalCoin,
            exp: (userData.exp || 0) + totalExp,
            data: userData.data
        });

        // ✨ Unique UI Design
        const msg = `🎁 **𝗠𝗔𝗖𝗞𝗬 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗𝗦**\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `👤 **Client:** ${userData.name}\n` +
                    `📅 **Date:** ${dateTime}\n\n` +
                    `💵 **Base Reward:** $${baseCoin.toLocaleString()}\n` +
                    `📈 **Wealth Bonus (5%):** $${wealthBonus.toLocaleString()}\n` +
                    `${luckBonus > 0 ? `🍀 **Luck Charm Bonus:** $${luckBonus.toLocaleString()}\n` : ""}` +
                    `✨ **Exp Gained:** +${totalExp}\n` +
                    `━━━━━━━━━━━━━━━━━━━\n` +
                    `💰 **Total Received:** $${totalCoin.toLocaleString()}\n\n` +
                    `*The more money you save, the higher your daily bonus grows!*`;

        return message.reply(msg);
    }
};