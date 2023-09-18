const { loadSlashCommands } = require("../utils/handler");

module.exports = async (client) => {
  await loadSlashCommands(client);

  const getSlashCommands = client.commands.map((x) => x);

  try {
    await client.application.commands.set(getSlashCommands);
    console.log(`[${new Date().toLocaleString()}] - Slash commands deployed globally!`);
  } catch (err) {
    console.error(err);
  }

  console.log(`[${new Date().toLocaleString()}] - ${client.user.tag} is ready!`);
};
