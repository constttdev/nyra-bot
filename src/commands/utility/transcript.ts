import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import fs from "fs";
import path from "path";

export const data = new SlashCommandBuilder()
  .setName("transcript")
  .setDescription("Get transcript")
  .addStringOption((o) =>
    o.setName("ticket").setDescription("Ticket name").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("ticket", true);
  const file = path.join("./transcripts", `${name}.txt`);

  if (!fs.existsSync(file)) {
    return interaction.reply({
      content: "Transcript not found",
      ephemeral: true,
    });
  }

  const attachment = new AttachmentBuilder(file);
  await interaction.reply({ files: [attachment], ephemeral: true });
}
