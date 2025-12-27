import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Stop Command
 * 
 * Stops playback and clears the entire queue.
 * The bot will remain in the voice channel.
 * 
 * Usage:
 * /stop - Stop playback and clear queue
 */
export const stop: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops playback and clears the queue'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue || !queue.isPlaying) {
      await interaction.reply({
        content: '❌ No song is currently playing!',
        flags: 64, // Ephemeral
      });
      return;
    }

    musicQueueService.stop(interaction.guildId!);

    await interaction.reply({
      content: '⏹️ Stopped playback and cleared the queue',
    });
  },
};

