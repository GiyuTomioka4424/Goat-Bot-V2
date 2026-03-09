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
			return `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
				`     𝗠𝗔𝗖𝗞𝗬 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗗𝗘𝗡𝗧𝗜𝗧𝗬\n` +
				`┗━━━━━━━━━━━━━━━━━━━━┛\n` +
				` ❯ 𝖲𝗒𝗌𝗍𝖾𝗆: 𝖮𝗇𝗅𝗂𝗇𝖾\n` +
				` ❯ 𝖣𝖺𝗍𝖺: 𝖱𝖾𝗍𝗋𝗂𝖾𝗏𝖾𝖽\n` +
				` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
				`${content}\n` +
				` ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;
		};

		// 1. Reply case
		if (messageReply) {
			return message.reply(formatMsg(` 👤 **𝖳𝖺𝗋𝗀𝖾𝗍:** [ 𝖱𝖾𝗉𝗅𝗒 ]\n 🆔 **𝖴𝖨𝖣:** ${messageReply.senderID}`));
		}

		// 2. Empty case (Self)
		if (!args[0]) {
			return message.reply(formatMsg(` 👤 **𝖳𝖺𝗋𝗀𝖾𝗍:** [ 𝖲𝖾𝗅𝖿 ]\n 🆔 **𝖴𝖨𝖣:** ${senderID}`));
		}

		// 3. Link case
		if (args[0].match(regExCheckURL)) {
			let result = '';
			for (const link of args) {
				try {
					const uid = await findUid(link);
					result += ` 🔗 **𝖴𝖱𝖫:** ${link}\n 🆔 **𝖴𝖨𝖣:** ${uid}\n\n`;
				}
				catch (e) {
					result += ` 🔗 **𝖴𝖱𝖫:** ${link}\n ❌ **𝖤𝖱𝖱𝖮𝖱:** 𝖭𝗈𝗍 𝖥𝗈𝗎𝗇𝖽\n\n`;
				}
			}
			return message.reply(formatMsg(result.trim()));
		}

		// 4. Mentions case
		let mentionResult = "";
		const mentionKeys = Object.keys(mentions);
		if (mentionKeys.length > 0) {
			for (const id of mentionKeys) {
				mentionResult += ` 👤 **𝖭𝖺𝗆𝖾:** ${mentions[id].replace("@", "")}\n 🆔 **𝖴𝖨𝖣:** ${id}\n\n`;
			}
			return message.reply(formatMsg(mentionResult.trim()));
		}

		return message.reply("⚠ Please tag someone, reply to a message, or provide a link.");
	}
};