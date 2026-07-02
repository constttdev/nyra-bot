import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ModalSubmitInteraction,
  TextChannel,
} from "discord.js";
import { saveTranscript } from "./transcriptManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY = "1522308749778489527";
const STAFF_ROLE = "1518157651526029423";
const FILE = path.join(__dirname, "../../tickets.json");

interface TicketData {
  id: string;
  fullId: string;
  type: string;
  user: string;
  data: Record<string, string>;
  created: number;
}

function loadTickets(): Record<string, TicketData> {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function saveTickets(data: Record<string, TicketData>) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function nextId(data: Record<string, TicketData>) {
  return String(Object.keys(data).length + 1).padStart(4, "0");
}

function buildTicketId(type: string, id: string) {
  return `${type}-${id}`;
}

function buildInfoEmbed(
  userId: string,
  type: string,
  fullId: string,
  data: Record<string, string>,
) {
  const embed = new EmbedBuilder()
    .setTitle(`Ticket ${fullId} • ${type}`)
    .setColor(0x5865f2)
    .addFields({
      name: "User",
      value: `<@${userId}>`,
      inline: false,
    })
    .setTimestamp();

  Object.entries(data).forEach(([key, value]) => {
    embed.addFields({
      name: key.toUpperCase(),
      value,
      inline: false,
    });
  });

  return embed;
}

export async function createTicket(
  interaction: ModalSubmitInteraction,
  type: string,
  data: Record<string, string>,
) {
  if (!interaction.guild) return;

  const tickets = loadTickets();

  const id = nextId(tickets);
  const fullId = buildTicketId(type, id);

  const channel = await interaction.guild.channels.create({
    name: fullId,
    type: ChannelType.GuildText,
    parent: CATEGORY,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id: STAFF_ROLE,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  tickets[channel.id] = {
    id,
    fullId,
    type,
    user: interaction.user.id,
    data,
    created: Date.now(),
  };

  saveTickets(tickets);

  const embed = buildInfoEmbed(interaction.user.id, type, fullId, data);

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger),
  );

  await (channel as TextChannel).send({
    content: `<@${interaction.user.id}>`,
    embeds: [embed],
    components: [closeRow],
  });

  await interaction.reply({
    content: `Ticket created: ${fullId}`,
    ephemeral: true,
  });
}

export async function handleButton(interaction: ButtonInteraction) {
  if (interaction.customId === "close_ticket") {
    const channel = interaction.channel as TextChannel;
    if (!channel || !interaction.guild) return;

    const tickets = loadTickets();
    const ticket = tickets[channel.id];

    await interaction.reply({
      content: "Closing ticket...",
      ephemeral: true,
    });

    const transcript = await saveTranscript(channel);

    const userId = ticket?.user;
    const ticketId = ticket?.fullId ?? channel.name;

    if (userId) {
      try {
        const user = await interaction.client.users.fetch(userId);

        const embed = new EmbedBuilder()
          .setTitle("Ticket Closed")
          .setColor(0x2b2d31)
          .addFields(
            {
              name: "Ticket ID",
              value: ticketId,
              inline: false,
            },
            {
              name: "Status",
              value: "Closed successfully",
              inline: false,
            },
            {
              name: "Info",
              value: "You can open a new ticket anytime.",
              inline: false,
            },
          )
          .setTimestamp();

        await user.send({
          embeds: [embed],
          files: transcript ? [transcript] : [],
        });
      } catch {}
    }

    setTimeout(() => {
      channel.delete().catch(() => {});
    }, 2000);

    return;
  }

  if (!interaction.customId.startsWith("ticket_")) return;

  const type = interaction.customId.replace("ticket_", "");

  const modal = new ModalBuilder()
    .setCustomId(`modal_${type}`)
    .setTitle(`Create ${type} ticket`);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("info")
        .setLabel("Describe your issue")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true),
    ),
  );

  await interaction.showModal(modal);
}

export async function handleModal(interaction: ModalSubmitInteraction) {
  const type = interaction.customId.replace("modal_", "");

  const data: Record<string, string> = {
    info: interaction.fields.getTextInputValue("info"),
  };

  await createTicket(interaction, type, data);
}
