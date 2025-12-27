import { Client, GatewayIntentBits, GuildMember } from 'discord.js';
import dotenv from 'dotenv';
import { joinChannel, leaveChannel } from './services/voiceManager.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

client.once('clientReady', () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
  console.log(`Bot ID: ${client.user?.id}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    await interaction.editReply(`Pong! 🏓\nLatency: ${latency}ms\nAPI Latency: ${apiLatency}ms`);
  }

  if (interaction.commandName === 'join') {
    const member = interaction.member as GuildMember;

    if (!member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel first!', ephemeral: true });
      return;
    }

    try {
      joinChannel(member.voice.channel);
      await interaction.reply({ content: `Joined ${member.voice.channel.name}!` });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to join the voice channel.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'leave') {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    const left = leaveChannel(interaction.guildId);

    if (left) {
      await interaction.reply({ content: 'Left the voice channel!' });
    } else {
      await interaction.reply({ content: 'I am not in a voice channel.', ephemeral: true });
    }
  }
});

client.login(token).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});
