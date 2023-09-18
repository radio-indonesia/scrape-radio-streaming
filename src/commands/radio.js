const {
  ApplicationCommandOptionType,
  CommandInteraction,
  AttachmentBuilder,
} = require("discord.js");
const { fetchRadio } = require("../utils/scrape");

const fs = require("fs");
const path = require("path");

module.exports = {
  name: "radio",
  category: "Music",
  categoryEmoji: "",
  description: "Gives you scraped data!",
  hidden: false,
  options: [
    {
      name: "page",
      description: "Page number that you want to get the data",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],

  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const pages = interaction.options.getInteger("page");
    const getRadio = await fetchRadio(pages);

    fs.writeFileSync(
      path.join(__dirname, `../assets/radio-list.json`),
      JSON.stringify(getRadio, null, 4),
      {
        encoding: "utf-8",
      }
    );

    const getJSONFile = path.join(__dirname, `../assets/radio-list.json`);
    const attachment = new AttachmentBuilder().setFile(getJSONFile);

    interaction.editReply({ content: "Here is the scraped data!", files: [attachment] });
  },
};
