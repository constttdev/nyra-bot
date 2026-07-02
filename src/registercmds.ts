import { ApplicationCommand, REST, Routes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Command {
  data: {
    name: string;
    description: string;
    options?: Array<{
      name: string;
      type: number;
      description: string;
      required?: boolean;
    }>;
    [key: string]: any;
  };
  toJSON(): Record<string, any>;
}

const commands: Record<string, any>[] = [];

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    await import(pathToFileURL(filePath).href).then((command) => {
      console.log(`CD ${JSON.stringify(command.data)}`);
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    });
  }
}

const token = String(process.env.TOKEN);
const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const client_id = String(process.env.CLIENT_ID);
    const guild_id = String(process.env.GUILD_ID);

    const data = await rest.put(
      Routes.applicationGuildCommands(client_id, guild_id),
      { body: commands }
    );

    const typedData = data as ApplicationCommand[];

    typedData.forEach((command) => {
      console.log(`Registered command: ${command.name} (ID: ${command.id})`);
    });
  } catch (error) {
    console.error(error);
  }
})();
