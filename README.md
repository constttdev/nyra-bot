# DiscordJS Bot Template

### Commands

Start the bot

- `pnpm run start`

Register commands

- `pnpm run registercmds`

### Features

- Command and Event Handling


- Example Command and example Event

### How to make it from a setguild bot to a public bot

- (OPTIONAL) Remove `GUILD_ID` in your `.env` and `.env.example` file

- (OPTIONAL) Remove `const guild_id = String(process.env.GUILD_ID)` in `src/registercmds.ts`

- Change `Routes.applicationGuildCommands(client_id, guild_id)` to `Routes.applicationCommands(client_id)` in `src/registercmds.ts`
  
