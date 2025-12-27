import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  VoiceChannel,
} from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Join Command
 * 
 * Makes the bot join your current voice channel.
 * If the bot is already in a voice channel, it will move to your channel.
 * 
 * Usage:
 * /join - Join the voice channel you're in
 */
export const join: Command = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins your voice channel'),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ You need to be in a voice channel!',
        flags: 64, // Ephemeral
      });
      return;
    }

    // Check if it's a VoiceChannel (not StageChannel)
    if (!(voiceChannel instanceof VoiceChannel)) {
      await interaction.reply({
        content: '❌ Please use a regular voice channel, not a stage channel!',
        flags: 64, // Ephemeral
      });
      return;
    }

    // Check if queue already exists (bot already connected)
    const existingQueue = musicQueueService.getQueue(interaction.guildId!);
    if (existingQueue) {
      await interaction.reply({
        content: '✅ Bot is already connected to a voice channel!',
      });
      return;
    }

    try {
      // Create new queue (which joins the voice channel)
      await musicQueueService.createQueue(
        interaction.guildId!,
        interaction.channel as any,
        voiceChannel
      );

      await interaction.reply({
        content: `✅ Joined **${voiceChannel.name}**!`,
      });
    } catch (error) {
      console.error('Error joining voice channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await interaction.reply({
        content: `❌ Failed to join voice channel: ${errorMessage}\n\nMake sure:\n- The bot has permission to join and speak in the voice channel\n- Required dependencies are installed (run: npm install)`,
        flags: 64, // Ephemeral
      });
    }
  },
};

