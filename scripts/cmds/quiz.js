const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const JAIL_FILE = path.join(process.cwd(), "jailData.json");
const spamTracker = new Map();

module.exports = {
  config: {
    name: "quiz",
    aliases: ["q", "trivia"],
    version: "3.0",
    author: "Kshitiz & Gab Yu",
    countDown: 5,
    role: 0,
    category: "fun"
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const { senderID, threadID } = event;

    // 🚨 SPAM / AUTO-ARREST LOGIC
    const now = Date.now();
    const userSpam = spamTracker.get(senderID) || { count: 0, last: 0 };
    if (now - userSpam.last < 1000) { 
        userSpam.count++;
        if (userSpam.count >= 6) {
            const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
            jailList[senderID] = { releaseAt: Date.now() + 3600000, reason: "Trivia System Exploitation" };
            fs.writeJsonSync(JAIL_FILE, jailList);
            await usersData.set(senderID, { money: -20000000 });
            return message.reply("🚨 **𝗔𝗨𝗧𝗢-𝗔𝗥𝗥𝗘𝗦𝗧**\nYou were caught spamming the trivia interface. You are now in **Jail** and fined **₱20M**.");
        }
    } else { userSpam.count = 0; }
    userSpam.last = now;
    spamTracker.set(senderID, userSpam);

    // 🚫 PRISONER RESTRICTION
    const jailList = fs.existsSync(JAIL_FILE) ? fs.readJsonSync(JAIL_FILE) : {};
    if (jailList[senderID] && Date.now() < jailList[senderID].releaseAt) {
      return message.reply("🚫 **𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗**\nPrisoners are not allowed to participate in educational quizzes!");
    }

    // --- SUBCOMMANDS ---
    if (args[0] === "list") {
      const categories = ["gk", "music", "videogame", "math", "history", "anime", "geography"];
      return message.reply(`📋 **𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘 𝗧𝗢𝗣𝗜𝗖𝗦**\n━━━━━━━━━━━━━━━\n${categories.join(" • ")}\n\n💡 Use: !quiz {topic}`);
    }

    if (args[0] === "top") {
        return message.reply("📊 This feature is currently undergoing maintenance.");
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

    const { question, options } = quizData;
    const optionsString = options.map((opt, index) => `${String.fromCharCode(65 + index)}. ${opt.answer}`).join("\n");

    const quizContent = `📝 **𝗠𝗔𝗖𝗞𝗬 𝗧𝗥𝗜𝗩𝗜𝗔: ${category.toUpperCase()}**\n━━━━━━━━━━━━━━━\n❓ **𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻:**\n${question}\n\n**𝗢𝗽𝘁𝗶𝗼𝗻𝘀:**\n${optionsString}\n━━━━━━━━━━━━━━━\n⏱️ *Reply with the correct letter (A, B, C, or D) within 20s!*`;

    await api.editMessage(quizContent, initMsg.messageID);

    global.GoatBot.onReply.set(initMsg.messageID, {
      commandName: this.config.name,
      messageID: initMsg.messageID,
      correctAnswerLetter: quizData.correct_answer_letter
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