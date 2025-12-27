import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Skip Command
 * 
 * Skips the currently playing song and moves to the next song in the queue.
 * If there are no more songs, playback will stop.
 * 
 * Usage:
 * /skip - Skip the current song
 */
export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue || !queue.isPlaying) {
      await interaction.reply({
        content: '❌ No song is currently playing!',
        flags: 64, // Ephemeral
      });
      return;
    }

    const currentSong = queue.songs[queue.currentIndex];
    musicQueueService.skip(interaction.guildId!);

    await interaction.reply({
      content: `⏭️ Skipped: **${currentSong.title}**`,
    });
  },
};

