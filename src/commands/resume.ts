import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Resume Command
 * 
 * Resumes playback of a paused song.
 * 
 * Usage:
 * /resume - Resume the paused song
 */
export const resume: Command = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes the paused song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue) {
      await interaction.reply({
        content: '❌ No song is currently playing!',
        flags: 64, // Ephemeral
      });
      return;
    }

    if (!queue.isPaused) {
      await interaction.reply({
        content: '❌ The song is not paused!',
        flags: 64, // Ephemeral
      });
      return;
    }

    musicQueueService.resume(interaction.guildId!);

    await interaction.reply({
      content: '▶️ Resumed playback',
    });
  },
};

