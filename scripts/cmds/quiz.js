const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const PRISON_FILE = path.join(process.cwd(), "prisonData.json");
const spamTracker = new Map();

module.exports = {
  config: {
    name: "quiz",
    aliases: ["q", "trivia"],
    version: "3.1",
    author: "Kshitiz & Gab Yu",
    countDown: 5,
    role: 0,
    category: "fun"
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const { senderID, threadID } = event;
    const now = Date.now();

    // --- 👮 AUTO-ARREST SPAM LOGIC ---
    const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
    if (now - userSpam.last < 1000) { 
        userSpam.count++;
        if (userSpam.count >= 6) {
            let prisonList = fs.existsSync(PRISON_FILE) ? fs.readJsonSync(PRISON_FILE) : {};
            const sentence = 1 * 60 * 60 * 1000; // 1 Hour
            const fine = 20000000;

            prisonList[senderID] = { 
                name: (await usersData.get(senderID)).name || "Trivia Spammer",
                releaseAt: now + sentence, 
                reason: "Trivia System Exploitation (Spam)" 
            };
            fs.writeJsonSync(PRISON_FILE, prisonList);
            
            await usersData.set(senderID, { money: ((await usersData.get(senderID)).money || 0) - fine });
            spamTracker.delete(senderID);
            return message.reply(`🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\n━━━━━━━━━━━━━━━\n⚠ **Reason:** Trivia Spamming\n💸 **Fine:** $${fine.toLocaleString()}\n⛓ **Sentence:** 1 Hour\n\n*Security has removed you from the Quiz Hall.*`);
        }
    } else { userSpam.count = 0; }
    userSpam.last = now;
    spamTracker.set(senderID, userSpam);

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
                ` ⚖️ 𝖤𝖽𝗎𝖼𝖺𝗍𝗂𝗈𝗇𝖺𝗅 𝗉𝗋𝗂𝗏𝗂𝗅𝖾𝗀𝖾𝗌 𝗌𝖾𝗂𝗓𝖾𝖽.`
            );
        }
    }

    // --- SUBCOMMANDS ---
    if (args[0] === "list") {
      const categories = ["gk", "music", "videogame", "math", "history", "anime", "geography"];
      return message.reply(`📋 **𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗧𝗢𝗣𝗜𝗖𝗦**\n━━━━━━━━━━━━━━━\n${categories.join(" • ")}\n\n💡 Use: !quiz {topic}`);
    }

    // --- QUIZ EXECUTION ---
    const category = args[0]?.toLowerCase() || "gk";
    const quizData = await fetchQuiz(category);
    if (!quizData) return message.reply("❌ Error fetching data. Topic might not exist.");

    // ✨ START ANIMATION
    const initMsg = await api.sendMessage("🔍 **𝗜𝗡𝗜𝗧𝗜𝗔𝗟𝗜𝗭𝗜𝗡𝗚 𝗠𝗔𝗖𝗞𝗬-𝗤𝗨𝗜𝗭...**\n`[▒▒▒▒▒▒▒▒▒▒]` 0%", threadID);
    await new Promise(r => setTimeout(r, 800));
    await api.editMessage("🔍 **𝗟𝗢𝗔𝗗𝗜𝗡𝗚 𝗤𝗨𝗘𝗦𝗧𝗜𝗢𝗡...**\n`[▓▓▓▓▓▓░░░░]` 60%", initMsg.messageID);
    await new Promise(r => setTimeout(r, 800));

    const { question, options, correct_answer_letter } = quizData;
    const optionsString = options.map((opt, index) => `${String.fromCharCode(65 + index)}. ${opt.answer}`).join("\n");

    const quizContent = `📝 **𝗠𝗔𝗖𝗞𝗬 𝗧𝗥𝗜𝗩𝗜𝗔: ${category.toUpperCase()}**\n━━━━━━━━━━━━━━━\n❓ **𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻:**\n${question}\n\n**𝗢𝗽𝘁𝗶𝗼𝗻𝘀:**\n${optionsString}\n━━━━━━━━━━━━━━━\n⏱ *Reply with the correct letter (A, B, C, or D) within 20s!*`;

    await api.editMessage(quizContent, initMsg.messageID);

    global.GoatBot.onReply.set(initMsg.messageID, {
      commandName: this.config.name,
      messageID: initMsg.messageID,
      correctAnswerLetter: correct_answer_letter
    });

    setTimeout(() => { api.unsend(initMsg.messageID).catch(() => {}); }, 20000);
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    const userAnswer = event.body.trim().toUpperCase();
    const { correctAnswerLetter, messageID } = Reply;

    if (userAnswer === correctAnswerLetter) {
      const currentMoney = (await usersData.get(event.senderID)).money || 0;
      await usersData.set(event.senderID, { money: currentMoney + 500 });
      await message.reply("🎉 **𝗖𝗢𝗥𝗥𝗘𝗖𝗧!**\nYou earned **$500**. Your knowledge is impressive!");
    } else {
      await message.reply(`🥺 **𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧**\nThe right answer was **${correctAnswerLetter}**.`);
    }

    message.unsend(event.messageID).catch(() => {});
    message.unsend(messageID).catch(() => {});
  }
};

async function fetchQuiz(category) {
  try {
    const response = await axios.get(`https://new-quiz-black.vercel.app/quiz?category=${category}`);
    return response.data;
  } catch (e) { return null; }
}