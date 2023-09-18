const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Client,
  CommandInteraction,
  ComponentType,
} = require("discord.js");

const {
  createAudioResource,
  joinVoiceChannel,
  createAudioPlayer,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  entersState,
} = require("@discordjs/voice");

const fs = require("fs");
const path = require("path");

module.exports = {
  name: "play",
  category: "Music",
  categoryEmoji: "",
  description: "Make the bot play some radio for you!",
  hidden: false,

  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  callback: async (client, interaction) => {
    if (!fs.existsSync(path.join(__dirname, `../assets/radio-list.json`))) {
      return interaction.reply({ content: "There are no radio list being made!", ephemeral: true });
    }

    const getRadio = JSON.parse(
      fs.readFileSync(path.join(__dirname, `../assets/radio-list.json`), { encoding: "utf-8" })
    );

    if (getRadio.length === 0) {
      return interaction.reply({ content: "There are no radio data!", ephemeral: true });
    }

    const radioList = getRadio.map((item) => ({
      label: item.nativeRadioName,
      value: item.radioName,
    }));

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("initial_radio_list")
        .setPlaceholder("Nothing selected")
        .addOptions(radioList)
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Radio channel list for: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setColor("#F1E05A")
      .setDescription(`There are **${getRadio.length}** radio channels that you can listen!`)
      .setFields({
        name: "📝 Notes",
        value: [
          ">>> This Radio command are still being tested, so bugs may appear!",
          `To report a bug, you can dm **Paiz#5599**`,
        ].join("\n"),
      });

    const fetchInteraction = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true,
    });

    // SELECT MENU COLLECTOR
    const createCollector = fetchInteraction.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
    });

    createCollector.on("collect", async (collected) => {
      await collected.deferReply({ ephemeral: true });

      if (interaction.user.id !== collected.user.id) {
        return collected.followUp({
          content: "This select menu does not belong to you!",
        });
      }

      const collectedRadio = JSON.parse(
        fs.readFileSync(path.join(__dirname, `../assets/radio-list.json`), { encoding: "utf-8" })
      );

      const getCollectedRadio = collectedRadio.find(
        (item) => item.radioName === collected.values[0]
      );

      // Radio part
      const getMember = client.guilds.cache
        .get(interaction.guild.id)
        .members.cache.get(interaction.member.user.id);
      const channel = getMember.voice.channel;

      if (!channel) {
        return collected.followUp({
          content: "You need to join a voice channel!",
        });
      }

      await createPlayer(channel, getCollectedRadio);

      collected.followUp({ content: "Started playing radio!" });

      const disableMenu = new ActionRowBuilder().addComponents(
        row.components[0].setPlaceholder("Expired").setDisabled(true)
      );

      if (fetchInteraction.editable) {
        fetchInteraction.edit({ embeds: [embed], components: [disableMenu] });
      } else {
        console.log(`[${new Date().toLocaleString()}] - CANNOT EDIT TO DISABLED SELECT MENU`);
      }
    });
  },
};

const createPlayer = async (voiceChannel, radioObj) => {
  const connection = joinVoiceChannel({
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    channelId: voiceChannel.id,
    guildId: voiceChannel.guildId,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(radioObj.streamURL);

  connection.subscribe(player);

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[${new Date().toLocaleString()}] - VOICE_CONNECTION_READY`);

    if (player.playable) {
      player.play(resource);
    } else {
      console.log(`[${new Date().toLocaleString()}] - VOICE_CONNECTION_READY IS NOT PLAYABLE`);
    }
  });

  connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
    try {
      console.log(`[${new Date().toLocaleString()}] - VOICE_CONNECTION_DISCONNECTED`);

      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch (err) {
      connection.destroy();
    }
  });

  player.on("error", (err) => {
    console.error(
      `[${new Date().toLocaleString()}] - PLAYER_ERROR >> ${err.message} with resource ${
        err.resource.metadata
      }`
    );
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log(`[${new Date().toLocaleString()}] - PLAYER_PLAYING`);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log(`[${new Date().toLocaleString()}] - PLAYER_IDLE`);
    connection.destroy();
  });
};
