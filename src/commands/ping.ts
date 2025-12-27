import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';

/**
 * Ping Command
 * 
 * A simple command that replies with "Pong!" to test bot responsiveness.
 */
export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Pong!');
  },
};

