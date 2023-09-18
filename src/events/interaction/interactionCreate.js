const { CommandInteraction } = require("discord.js");

/**
 *
 * @param {CommandInteraction} interaction
 */
module.exports = async (client, interaction) => {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.callback(client, interaction);
  } catch (err) {
    console.log(err);
  }
};
