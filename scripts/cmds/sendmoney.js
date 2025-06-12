module.exports = {
  config: {
    name: "sendmoney",
    aliases: ["transfer", "pay"],
    version: "2.0",
    author: "GabYu",
    countDown: 5,
    role: 0,
    shortDescription: "Send money to a user",
    longDescription: "Transfer your balance to another user using mention and amount",
    category: "economy",
    guide: "{p}sendmoney @mention 1000"
  },

  onStart: async function ({ message, event, usersData, args }) {
    const senderID = event.senderID;
    const mentionID = Object.keys(event.mentions)[0];

    if (!mentionID)
      return message.reply("❌ You need to mention someone to send money to.");

    // Find amount anywhere in args
    let amount = 0;
    for (let arg of args) {
      if (!isNaN(arg) && parseInt(arg) > 0) {
        amount = parseInt(arg);
        break;
      }
    }

    if (!amount || amount <= 0)
      return message.reply("❌ Please enter a valid positive number to send.");

    if (mentionID === senderID)
      return message.reply("❌ You can't send money to yourself.");

    const senderData = await usersData.get(senderID);
    const receiverData = await usersData.get(mentionID);

    if (senderData.money < amount)
      return message.reply("💸 You don't have enough balance to send.");

    // Transfer money
    await usersData.set(senderID, {
      money: senderData.money - amount
    });

    await usersData.set(mentionID, {
      money: receiverData.money + amount
    });

    return message.reply(
      `✅ You sent $${amount} to ${receiverData.name}.\n💰 Your new balance: $${senderData.money - amount}`
    );
  }
};