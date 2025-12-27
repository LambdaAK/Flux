import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';

/**
 * Leave Command
 * 
 * Makes the bot leave the voice channel and clears the music queue.
 * 
 * Usage:
 * /leave - Leave the voice channel
 */
export const leave: Command = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the voice channel'),

  async execute(interaction: ChatInputCommandInteraction) {
    const queue = musicQueueService.getQueue(interaction.guildId!);

    if (!queue) {
      await interaction.reply({
        content: '❌ Bot is not in a voice channel!',
        flags: 64, // Ephemeral
      });
      return;
    }

    musicQueueService.deleteQueue(interaction.guildId!);

    await interaction.reply({
      content: '👋 Left the voice channel!',
    });
  },
};

