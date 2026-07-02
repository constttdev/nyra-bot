import { AttachmentBuilder, TextChannel } from "discord.js";
import fs from "fs";
import path from "path";

export async function saveTranscript(channel: TextChannel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  const content = messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((m) => `[${m.author.tag}] ${m.content}`)
    .join("\n");

  const dir = "./transcripts";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${channel.name}.txt`);
  fs.writeFileSync(filePath, content);

  return new AttachmentBuilder(filePath);
}
