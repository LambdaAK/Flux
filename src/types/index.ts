import { SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandOptionsOnlyBuilder } from 'discord.js';

/**
 * Base interface for all slash commands
 */
export interface Command {
  /** The command data builder */
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  /** The command execution function */
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

/**
 * Represents a song in the music queue
 */
export interface Song {
  /** The title of the song */
  title: string;
  /** The URL of the song */
  url: string;
  /** The duration of the song in seconds */
  duration: number;
  /** The thumbnail URL of the song */
  thumbnail?: string;
  /** The user who requested the song */
  requestedBy: string;
}

import { VoiceConnection, AudioPlayer } from '@discordjs/voice';
import { TextChannel } from 'discord.js';

/**
 * Represents the music queue for a guild
 */
export interface MusicQueue {
  /** The voice channel connection */
  connection: VoiceConnection;
  /** The audio player */
  player: AudioPlayer;
  /** The queue of songs */
  songs: Song[];
  /** Whether the player is currently playing */
  isPlaying: boolean;
  /** Whether the player is paused */
  isPaused: boolean;
  /** The current song index */
  currentIndex: number;
  /** The text channel for sending messages */
  textChannel: TextChannel;
}

