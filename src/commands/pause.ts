import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Pause Command
 * 
 * Pauses the currently playing song. Use /resume to continue playback.
 * 
 * Usage:
 * /pause - Pause the current song
 */
export const pause: Command = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the current song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue || !queue.isPlaying) {
      await interaction.reply({
        content: '❌ No song is currently playing!',
        flags: 64, // Ephemeral
      });
      return;
    }

    if (queue.isPaused) {
      await interaction.reply({
        content: '❌ The song is already paused!',
        flags: 64, // Ephemeral
      });
      return;
    }

    musicQueueService.pause(interaction.guildId!);

    await interaction.reply({
      content: '⏸️ Paused playback',
    });
  },
};

