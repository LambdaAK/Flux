import {
  VoiceConnection,
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnectionStatus,
  getVoiceConnection,
  entersState,
} from '@discordjs/voice';
import ytdl from 'ytdl-core';
import { Song, MusicQueue } from '../types';
import { TextChannel, VoiceBasedChannel } from 'discord.js';

/**
 * Music Queue Service
 * 
 * Manages music queues for each Discord guild (server).
 * Each guild has its own independent queue and player.
 */
class MusicQueueService {
  private queues: Map<string, MusicQueue> = new Map();

  /**
   * Gets or creates a music queue for a guild
   * @param guildId - The Discord guild ID
   * @returns The music queue for the guild
   */
  getQueue(guildId: string): MusicQueue | undefined {
    return this.queues.get(guildId);
  }

  /**
   * Creates a new music queue for a guild
   * @param guildId - The Discord guild ID
   * @param textChannel - The text channel for sending messages
   * @param voiceChannel - The voice channel to join
   * @returns The created music queue
   */
  async createQueue(
    guildId: string,
    textChannel: TextChannel,
    voiceChannel: VoiceBasedChannel
  ): Promise<MusicQueue> {
    // Check if connection already exists and destroy it
    const existingConnection = getVoiceConnection(voiceChannel.guild.id);
    if (existingConnection) {
      existingConnection.destroy();
    }

    // Create voice connection with explicit encryption configuration
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
      selfDeaf: false,
      selfMute: false,
    });

    // Wait for connection to be ready
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      console.log(`Voice connection ready in ${guildId}`);
    } catch (error) {
      console.error(`Failed to establish voice connection in ${guildId}:`, error);
      connection.destroy();
      throw error;
    }

    // Create audio player
    const player = createAudioPlayer();

    // Subscribe connection to player
    connection.subscribe(player);

    // Handle connection events
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log(`Connected to voice channel in ${guildId}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
      console.log(`Disconnected from voice channel in ${guildId}`);
      this.deleteQueue(guildId);
    });

    connection.on(VoiceConnectionStatus.Signalling, () => {
      console.log(`Signalling connection in ${guildId}`);
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
      console.log(`Connecting to voice channel in ${guildId}`);
    });

    // Handle connection errors
    connection.on('error', (error: Error) => {
      console.error(`Voice connection error in ${guildId}:`, error);
      textChannel.send(`❌ Voice connection error: ${error.message}`).catch(console.error);
    });

    // Handle state change errors
    connection.on('stateChange', (oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        const reason = (newState as any).reason;
        if (reason === 4014) {
          // Connection closed intentionally
          console.log(`Connection closed intentionally in ${guildId}`);
        } else {
          // Connection closed unexpectedly
          console.log(`Connection closed unexpectedly in ${guildId}, reason: ${reason}`);
          // Clean up the queue
          setTimeout(() => {
            const queue = this.queues.get(guildId);
            if (queue && !connection.state.status) {
              this.deleteQueue(guildId);
            }
          }, 1000);
        }
      }
    });

    // Handle player events
    player.on(AudioPlayerStatus.Idle, () => {
      this.playNext(guildId);
    });

    player.on('error', (error: Error) => {
      console.error(`Audio player error in ${guildId}:`, error);
      this.playNext(guildId);
    });

    const queue: MusicQueue = {
      connection,
      player,
      songs: [],
      isPlaying: false,
      isPaused: false,
      currentIndex: 0,
      textChannel,
    };

    this.queues.set(guildId, queue);
    return queue;
  }

  /**
   * Deletes a music queue for a guild
   * @param guildId - The Discord guild ID
   */
  deleteQueue(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (queue) {
      queue.player.stop();
      queue.connection.destroy();
      this.queues.delete(guildId);
    }
  }

  /**
   * Adds a song to the queue
   * @param guildId - The Discord guild ID
   * @param song - The song to add
   */
  addSong(guildId: string, song: Song): void {
    const queue = this.queues.get(guildId);
    if (queue) {
      queue.songs.push(song);
    }
  }

  /**
   * Plays the next song in the queue
   * @param guildId - The Discord guild ID
   */
  async playNext(guildId: string): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    // Move to next song
    queue.currentIndex++;

    // Check if there are more songs
    if (queue.currentIndex >= queue.songs.length) {
      queue.isPlaying = false;
      queue.currentIndex = 0;
      queue.songs = [];
      return;
    }

    // Play the next song
    await this.play(guildId, queue.currentIndex);
  }

  /**
   * Plays a specific song in the queue
   * @param guildId - The Discord guild ID
   * @param index - The index of the song to play (defaults to current)
   */
  async play(guildId: string, index?: number): Promise<void> {
    const queue = this.queues.get(guildId);
    if (!queue || queue.songs.length === 0) return;

    const songIndex = index !== undefined ? index : queue.currentIndex;
    if (songIndex < 0 || songIndex >= queue.songs.length) return;

    const song = queue.songs[songIndex];
    queue.currentIndex = songIndex;
    queue.isPlaying = true;
    queue.isPaused = false;

    try {
      // Create audio resource from YouTube URL
      const stream = ytdl(song.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25, // 32MB buffer
      });

      const resource = createAudioResource(stream, {
        inlineVolume: true,
      });

      queue.player.play(resource);

      // Send now playing message
      await queue.textChannel.send({
        embeds: [
          {
            title: '🎵 Now Playing',
            description: `**${song.title}**\nRequested by: <@${song.requestedBy}>`,
            color: 0x00ff00,
            thumbnail: song.thumbnail ? { url: song.thumbnail } : undefined,
          },
        ],
      });
    } catch (error) {
      console.error(`Error playing song in ${guildId}:`, error);
      queue.textChannel.send('❌ Error playing song. Skipping...');
      this.playNext(guildId);
    }
  }

  /**
   * Skips the current song
   * @param guildId - The Discord guild ID
   */
  skip(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    queue.player.stop();
    // playNext will be called automatically by the Idle event
  }

  /**
   * Pauses the current song
   * @param guildId - The Discord guild ID
   */
  pause(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue || !queue.isPlaying) return;

    queue.player.pause();
    queue.isPaused = true;
  }

  /**
   * Resumes the current song
   * @param guildId - The Discord guild ID
   */
  resume(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue || !queue.isPaused) return;

    queue.player.unpause();
    queue.isPaused = false;
  }

  /**
   * Stops playback and clears the queue
   * @param guildId - The Discord guild ID
   */
  stop(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    queue.player.stop();
    queue.songs = [];
    queue.currentIndex = 0;
    queue.isPlaying = false;
    queue.isPaused = false;
  }

  /**
   * Shuffles the queue
   * @param guildId - The Discord guild ID
   */
  shuffle(guildId: string): void {
    const queue = this.queues.get(guildId);
    if (!queue || queue.songs.length <= 1) return;

    // Keep current song, shuffle the rest
    const currentSong = queue.songs[queue.currentIndex];
    const remainingSongs = [
      ...queue.songs.slice(0, queue.currentIndex),
      ...queue.songs.slice(queue.currentIndex + 1),
    ];

    // Fisher-Yates shuffle
    for (let i = remainingSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]];
    }

    queue.songs = [currentSong, ...remainingSongs];
    queue.currentIndex = 0;
  }
}

// Export singleton instance
export const musicQueueService = new MusicQueueService();

