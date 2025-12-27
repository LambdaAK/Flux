import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  GuildMember,
  VoiceChannel,
} from 'discord.js';
import { Command } from '../types';
import { musicQueueService } from '../services/musicQueue';
import YouTube from 'youtube-sr';
import ytdl from 'ytdl-core';

/**
 * Play Command
 * 
 * Plays a song from YouTube. Can accept a YouTube URL or search query.
 * If the bot is not in a voice channel, it will join the user's voice channel.
 * 
 * Usage:
 * /play <song> - Play a song by URL or search query
 */
export const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song from YouTube')
    .addStringOption((option) =>
      option
        .setName('song')
        .setDescription('YouTube URL or search query')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    // Check if user is in a voice channel
    if (!voiceChannel) {
      await interaction.editReply({
        content: '❌ You need to be in a voice channel to use this command!',
      });
      return;
    }

    // Check if it's a VoiceChannel (not StageChannel)
    if (!(voiceChannel instanceof VoiceChannel)) {
      await interaction.editReply({
        content: '❌ Please use a regular voice channel, not a stage channel!',
      });
      return;
    }

    const songQuery = interaction.options.getString('song', true);
    let songUrl = songQuery;
    let songTitle = '';
    let songDuration = 0;
    let thumbnail: string | undefined;

    try {
      // Check if it's a URL or search query
      if (!songQuery.startsWith('http')) {
        // Search for the song
        await interaction.editReply({
          content: '🔍 Searching for song...',
        });

        const searchResult = await YouTube.search(songQuery, { limit: 1, type: 'video' });
        if (!searchResult || searchResult.length === 0) {
          await interaction.editReply({
            content: '❌ No results found for your search.',
          });
          return;
        }

        const video = searchResult[0];
        songUrl = video.url;
        songTitle = video.title || 'Unknown Title';
        songDuration = video.duration?.seconds || 0;
        thumbnail = video.thumbnail?.url;
      } else {
        // It's a URL, get video info using ytdl
        if (!ytdl.validateURL(songQuery)) {
          await interaction.editReply({
            content: '❌ Invalid YouTube URL.',
          });
          return;
        }

        const videoInfo = await ytdl.getInfo(songQuery);
        songTitle = videoInfo.videoDetails.title || 'Unknown Title';
        songDuration = parseInt(videoInfo.videoDetails.lengthSeconds) || 0;
        thumbnail = videoInfo.videoDetails.thumbnails[0]?.url;
      }

      // Get or create queue
      let queue = musicQueueService.getQueue(interaction.guildId!);
      if (!queue) {
        queue = await musicQueueService.createQueue(
          interaction.guildId!,
          interaction.channel as any,
          voiceChannel
        );
      }

      // Add song to queue
      const song = {
        title: songTitle,
        url: songUrl,
        duration: songDuration,
        thumbnail,
        requestedBy: interaction.user.id,
      };

      musicQueueService.addSong(interaction.guildId!, song);

      // If not playing, start playing
      if (!queue.isPlaying) {
        await musicQueueService.play(interaction.guildId!);
        await interaction.editReply({
          content: `✅ Added to queue: **${songTitle}**`,
        });
      } else {
        await interaction.editReply({
          content: `✅ Added to queue: **${songTitle}** (Position: ${queue.songs.length})`,
        });
      }
    } catch (error) {
      console.error('Error in play command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while trying to play the song.',
      });
    }
  },
};

