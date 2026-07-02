import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from "discord.js";

const PANEL_ROLE = "1522308531628539924";

export const data = new SlashCommandBuilder()
  .setName("sendpanel")
  .setDescription("Send the ticket panel");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PANEL_ROLE)) {
    return interaction.reply({ content: "No permission", ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle("Support Panel")
    .setDescription(
      "Create a ticket by selecting a category.\n\n" +
        "Moderation Support\n" +
        "Client Support\n" +
        "Bug or User Report\n" +
        "Billing Support",
    )
    .setColor(0x5865f2);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_moderation")
      .setLabel("Moderation Support")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_client")
      .setLabel("Client Support")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_bug")
      .setLabel("Bug or User Report")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_billing")
      .setLabel("Billing Support")
      .setStyle(ButtonStyle.Success),
  );

  await interaction.channel?.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: "Panel sent", ephemeral: true });
}
