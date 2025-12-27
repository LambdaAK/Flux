import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../types';
import { commands } from './index';

/**
 * Help Command
 * 
 * Displays a list of all available commands with their descriptions.
 */
export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands'),

  async execute(interaction: ChatInputCommandInteraction) {
    const helpMessage = Object.values(commands)
      .map(cmd => `**/${cmd.data.name}** - ${cmd.data.description}`)
      .join('\n');

    await interaction.reply({
      content: `## Available Commands\n\n${helpMessage}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

