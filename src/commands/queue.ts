import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Queue Command
 * 
 * Displays the current music queue with all songs in order.
 * Shows the currently playing song and upcoming songs.
 * 
 * Usage:
 * /queue - View the current queue
 */
export const queue: Command = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Shows the current music queue'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue || queue.songs.length === 0) {
      await interaction.reply({
        content: '❌ The queue is empty!',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentSong = queue.songs[queue.currentIndex];
    const upcomingSongs = queue.songs.slice(queue.currentIndex + 1);

    let queueMessage = `**Now Playing:** ${currentSong.title}\n\n`;

    if (upcomingSongs.length > 0) {
      queueMessage += '**Upcoming:**\n';
      upcomingSongs.slice(0, 10).forEach((song, index) => {
        queueMessage += `${queue.currentIndex + index + 1}. ${song.title}\n`;
      });

      if (upcomingSongs.length > 10) {
        queueMessage += `\n... and ${upcomingSongs.length - 10} more`;
      }
    } else {
      queueMessage += 'No more songs in queue.';
    }

    await interaction.reply({
      content: queueMessage,
      flags: MessageFlags.Ephemeral,
    });
  },
};

