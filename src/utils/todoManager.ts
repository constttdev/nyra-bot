import fs from "fs";
import path from "path";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonInteraction,
  ModalSubmitInteraction,
  ChatInputCommandInteraction,
} from "discord.js";

const FILE = path.join(process.cwd(), "todos.json");
const PANEL_ROLE = "1518157651526029423";
const TODO_ROLE = "1518156258387951656";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  created: number;
  userId: string;
}

interface TodoDB {
  panel?: {
    channelId: string;
    messageId: string;
  };
  todos: Record<string, Todo>;
}

function loadDB(): TodoDB {
  if (!fs.existsSync(FILE)) {
    return { todos: {}, panel: undefined };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(FILE, "utf-8"));

    return {
      panel: raw?.panel ?? undefined,
      todos: raw?.todos ?? {},
    };
  } catch {
    return { todos: {}, panel: undefined };
  }
}

function saveDB(data: TodoDB) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function nextId(todos: Record<string, Todo> | undefined) {
  const safe = todos ?? {};
  return String(Object.keys(safe).length + 1).padStart(4, "0");
}

function canManageTodos(interaction: any) {
  return interaction.member?.roles?.cache?.has(TODO_ROLE);
}

function canManagePanel(interaction: any) {
  return interaction.member?.roles?.cache?.has(PANEL_ROLE);
}

function buildEmbed(todos: Record<string, Todo> | undefined) {
  const safeTodos = todos ?? {};

  const embed = new EmbedBuilder()
    .setTitle("Todo Panel")
    .setColor(0x2b2d31)
    .setTimestamp();

  const list = Object.values(safeTodos);

  if (list.length === 0) {
    embed.setDescription("No todos");
    return embed;
  }

  embed.setDescription(
    list
      .map(
        (t) => `${t.done ? "~~" : ""}${t.id} - ${t.text}${t.done ? "~~" : ""}`,
      )
      .join("\n"),
  );

  return embed;
}

function panelButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("todo_add")
      .setLabel("Add")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("todo_done")
      .setLabel("Done")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("todo_remove")
      .setLabel("Remove")
      .setStyle(ButtonStyle.Danger),
  );
}

async function updatePanel(client: any) {
  const db = loadDB();
  if (!db.panel) return;

  const channel = await client.channels
    .fetch(db.panel.channelId)
    .catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const message = await channel.messages
    .fetch(db.panel.messageId)
    .catch(() => null);
  if (!message) return;

  await message.edit({
    embeds: [buildEmbed(db.todos)],
    components: [panelButtons()],
  });
}

export async function sendTodoPanel(interaction: ChatInputCommandInteraction) {
  if (!canManagePanel(interaction)) {
    return interaction.reply({
      content: "You do not have permission to send the todo panel.",
      ephemeral: true,
    });
  }

  const db = loadDB();

  const msg = await interaction.channel?.send({
    embeds: [buildEmbed(db.todos)],
    components: [panelButtons()],
  });

  if (!msg || !interaction.channel) return;

  db.panel = {
    channelId: interaction.channel.id,
    messageId: msg.id,
  };

  saveDB(db);

  await interaction.reply({
    content: "Todo panel sent",
    ephemeral: true,
  });
}

export async function handleTodoButton(interaction: ButtonInteraction) {
  if (!canManageTodos(interaction)) {
    return interaction.reply({
      content: "No permission",
      ephemeral: true,
    });
  }

  if (interaction.customId === "todo_add") {
    const modal = new ModalBuilder()
      .setCustomId("todo_add_modal")
      .setTitle("Add Todo");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("text")
          .setLabel("Todo")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

    return interaction.showModal(modal);
  }

  if (interaction.customId === "todo_done") {
    const modal = new ModalBuilder()
      .setCustomId("todo_done_modal")
      .setTitle("Mark Done");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("Todo ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

    return interaction.showModal(modal);
  }

  if (interaction.customId === "todo_remove") {
    const modal = new ModalBuilder()
      .setCustomId("todo_remove_modal")
      .setTitle("Remove Todo");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("Todo ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

    return interaction.showModal(modal);
  }
}

export async function handleTodoModal(interaction: ModalSubmitInteraction) {
  const db = loadDB();

  if (!hasRole(interaction)) {
    return interaction.reply({
      content: "No permission",
      ephemeral: true,
    });
  }

  if (interaction.customId === "todo_add_modal") {
    const id = nextId(db.todos ?? {});

    db.todos[id] = {
      id,
      text: interaction.fields.getTextInputValue("text"),
      done: false,
      created: Date.now(),
      userId: interaction.user.id,
    };
  }

  if (interaction.customId === "todo_done_modal") {
    const id = interaction.fields.getTextInputValue("id");
    if (db.todos[id]) db.todos[id].done = true;
  }

  if (interaction.customId === "todo_remove_modal") {
    const id = interaction.fields.getTextInputValue("id");
    const todo = db.todos[id];

    if (!todo) {
      return interaction.reply({
        content: "Todo not found.",
        ephemeral: true,
      });
    }

    const isPanelManager = canManagePanel(interaction);

    if (!isPanelManager && todo.userId !== interaction.user.id) {
      return interaction.reply({
        content: "You can only remove your own todos.",
        ephemeral: true,
      });
    }

    delete db.todos[id];
  }

  saveDB(db);

  await updatePanel(interaction.client);

  await interaction.reply({
    content: "Updated",
    ephemeral: true,
  });
}
