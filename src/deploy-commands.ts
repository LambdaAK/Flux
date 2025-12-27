import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong and shows bot latency'),
].map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);

const clientId = process.env.CLIENT_ID;

if (!clientId) {
  console.error('CLIENT_ID is not set in .env file');
  process.exit(1);
}

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    ) as any;

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
