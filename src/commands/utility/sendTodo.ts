import { SlashCommandBuilder } from "discord.js";
import { sendTodoPanel } from "../../utils/todoManager";

export const data = new SlashCommandBuilder()
  .setName("todo")
  .setDescription("Send todo panel");

export async function execute(interaction: any) {
  await sendTodoPanel(interaction);
}
