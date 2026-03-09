const fs = require("fs");
const path = require("path");

const cooldownTime = 2 * 60 * 60 * 1000; // 2 hours
const cooldowns = new Map();

const ADMIN_UID = "61562953390569";
let commandEnabled = true;

// Path to thread storage
const THREADS_FILE = path.join(__dirname, "threads.json");

// Load threads from JSON or create empty array
let allThreads = [];
if (fs.existsSync(THREADS_FILE)) {
  try {
    allThreads = JSON.parse(fs.readFileSync(THREADS_FILE, "utf-8"));
  } catch (e) {
    console.log("Failed to load threads.json, starting fresh.");
    allThreads = [];
  }
}

// Function to save threads
function saveThreads() {
  fs.writeFileSync(THREADS_FILE, JSON.stringify(allThreads, null, 2));
}

module.exports = {
  config: {
    name: "notifyconfess",
    version: "1.7",
    author: "GabYu",
    role: 0,
    shortDescription: "Anonymous confession notification to all threads",
    longDescription:
      "Send an anonymous confession to all threads the bot is in. Admin can turn it on/off. 2-hour cooldown.",
    category: "fun",
    guide:
      "{pn} <your confession>\n{pn} on (admin only)\n{pn} off (admin only)"
  },

  onStart: async function ({ api, event, args }) {
    const userID = event.senderID;
    const currentThreadID = event.threadID;

    // ===== SAVE CURRENT THREAD =====
    if (!allThreads.includes(currentThreadID)) {
      allThreads.push(currentThreadID);
      saveThreads();
    }

    // ===== ADMIN ON/OFF =====
    if (args[0] === "on" || args[0] === "off") {
      if (userID !== ADMIN_UID) {
        return api.sendMessage(
          "❌ | Only the admin can turn this command on or off.",
          currentThreadID
        );
      }

      commandEnabled = args[0] === "on";
      return api.sendMessage(
        `✅ | notifyconfess has been turned ${commandEnabled ? "ON" : "OFF"}.`,
        currentThreadID
      );
    }

    // ===== CHECK ENABLE =====
    if (!commandEnabled) {
      return api.sendMessage(
        "🚫 | This command is currently disabled by the admin.",
        currentThreadID
      );
    }

    // ===== COOLDOWN =====
    const lastUsed = cooldowns.get(userID);
    if (lastUsed && Date.now() - lastUsed < cooldownTime) {
      const remaining = cooldownTime - (Date.now() - lastUsed);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.ceil(
        (remaining % (1000 * 60 * 60)) / (1000 * 60)
      );
      return api.sendMessage(
        `⏳ | Please wait ${hours}h ${minutes}m before using this again.`,
        currentThreadID
      );
    }

    // ===== ARGUMENT CHECK =====
    if (args.length === 0) {
      return api.sendMessage(
        "❌ | Usage: !notifyconfess <your confession>",
        currentThreadID
      );
    }

    const confession = args.join(" ");

    // Limit length
    if (confession.length > 300) {
      return api.sendMessage(
        "❌ | Confession is too long (max 300 characters).",
        currentThreadID
      );
    }

    // ===== MESSAGE =====
    const msg =
      `🔔 𝗖𝗢𝗡𝗙𝗘𝗦𝗦𝗜𝗢𝗡 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡\n\n` +
      `📩 An anonymous member confessed:\n\n` +
      `"${confession}"\n\n` +
      `— Sent anonymously`;

    // ===== SEND TO ALL THREADS SAFELY =====
    let successCount = 0;

    for (const threadID of allThreads) {
      try {
        await api.sendMessage(msg, threadID);
        successCount++;
      } catch (err) {
        console.log(`❌ Failed to send to thread ${threadID}`);
      }
    }

    cooldowns.set(userID, Date.now());
    api.sendMessage(
      `✅ | Confession notification sent to ${successCount} thread(s) successfully.`,
      currentThreadID
    );
  }
};