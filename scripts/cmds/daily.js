const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "daily",
		version: "2.0",
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
		const reward = envCommands[commandName].rewardFirstDay;
		const userData = await usersData.get(senderID);
		const currentMoney = userData.money || 0;

		// 📅 Date Check (Manila Time)
		const dateTime = moment.tz("Asia/Manila").format("DD/MM/YYYY");
		if (userData.data && userData.data.lastTimeGetReward === dateTime) {
			return message.reply("📋 **𝗗𝗔𝗜𝗟𝗬 𝗦𝗧𝗔𝗧𝗨𝗦**\nYou have already collected your gift for today. Come back tomorrow! 🕒");
		}

		// 💰 Wealth Scaling Logic (Unique Feature)
		// Bonus is 5% of their current money, capped at $1M to keep the economy stable
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