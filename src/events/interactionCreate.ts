import {
  Events,
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";

import * as ticketManager from "../utils/ticketManager";
import * as todoManager from "../utils/todoManager";

export const name = Events.InteractionCreate;

export const execute = async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const cmd = interaction.client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction as ChatInputCommandInteraction);
      return;
    }

    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;

      if (btn.customId.startsWith("todo_")) {
        await todoManager.handleTodoButton(btn);
        return;
      }

      await ticketManager.handleButton(btn);
      return;
    }

    if (interaction.isModalSubmit()) {
      const modal = interaction as ModalSubmitInteraction;

      if (modal.customId.startsWith("todo_")) {
        await todoManager.handleTodoModal(modal);
        return;
      }

      await ticketManager.handleModal(modal);
      return;
    }
  } catch (err) {
    console.error(err);

    if (
      interaction.isChatInputCommand() ||
      interaction.isButton() ||
      interaction.isModalSubmit()
    ) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Error processing interaction",
          ephemeral: true,
        });
      }
    }
  }
};
