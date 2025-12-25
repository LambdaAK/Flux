import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

client.once('ready', async () => {
  console.log(`Bot is ready! Logged in as ${client.user?.tag}`);

  // Register slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Replies with Pong!')
      .toJSON(),
  ];

  const rest = new REST().setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    if (client.user) {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands },
      );

      console.log('Successfully reloaded application (/) commands.');
    }
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(token);

