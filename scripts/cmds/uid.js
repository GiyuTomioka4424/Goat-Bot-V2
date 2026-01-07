const { findUid } = global.utils;
const regExCheckURL = /^(http|https):\/\/[^ "]+$/;

module.exports = {
	config: {
		name: "uid",
		version: "2.1",
		author: "NTKhang x Gab Yu",
		countDown: 5,
		role: 0,
		description: {
			vi: "Xem user id facebook của người dùng",
			en: "View facebook user id of user"
		},
		category: "info",
		guide: {
			en: "{pn} | @tag | <link profile>"
		}
	},

	onStart: async function ({ message, event, args }) {
		const { threadID, senderID, messageReply, mentions } = event;

		const formatMsg = (content) => {
			return `👤 **𝗠𝗔𝗖𝗞𝗬 𝗨𝗦𝗘𝗥 𝗜𝗗𝗘𝗡𝗧𝗜𝗧𝗬**\n` +
				`━━━━━━━━━━━━━━━━━━\n\n` +
				`${content}\n\n` +
				`━━━━━━━━━━━━━━━━━━\n` +
				`✨ *Use these IDs for bank/arrest/jail!*`;
		};

		// 1. Reply case
		if (messageReply) {
			return message.reply(formatMsg(`🆔 **UID:** ${messageReply.senderID}`));
		}

		// 2. Empty case (Self)
		if (!args[0]) {
			return message.reply(formatMsg(`🆔 **Your UID:** ${senderID}`));
		}

		// 3. Link case
		if (args[0].match(regExCheckURL)) {
			let result = '';
			for (const link of args) {
				try {
					const uid = await findUid(link);
					result += `🔗 ${link}\n🆔 **UID:** ${uid}\n\n`;
				}
				catch (e) {
					result += `🔗 ${link}\n❌ **ERROR:** Failed to fetch UID\n\n`;
				}
			}
			return message.reply(formatMsg(result.trim()));
		}

		// 4. Mentions case
		let mentionResult = "";
		const mentionKeys = Object.keys(mentions);
		if (mentionKeys.length > 0) {
			for (const id of mentionKeys) {
				mentionResult += `👤 **${mentions[id].replace("@", "")}**\n🆔 **UID:** ${id}\n\n`;
			}
			return message.reply(formatMsg(mentionResult.trim()));
		}

		return message.reply("⚠ Please tag someone, reply to a message, or provide a link.");
	}
};