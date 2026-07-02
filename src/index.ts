import fs from "node:fs";
import path from "node:path";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Command {
  name: string;
  description: string;
  execute: (args: any[]) => void;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
}) as ExtendedClient;

interface ExtendedClient extends Client {
  client: any;
  commands: Map<string, Command>;
}

client.commands = new Map();

async function loadCommands() {
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
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      });
    }
  }
}

async function loadEvents() {
  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    await import(pathToFileURL(filePath).href).then((event) => {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    });
  }
}

async function loadAllModules() {
  await loadCommands();
  await loadEvents();
  const token = String(process.env.TOKEN);
  client.login(token);
}

loadAllModules().catch(console.error);

export default client;
