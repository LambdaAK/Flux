import { joinVoiceChannel, VoiceConnection, getVoiceConnection } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

const connections = new Map<string, VoiceConnection>();

export function joinChannel(channel: VoiceBasedChannel): VoiceConnection {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connections.set(channel.guild.id, connection);
  return connection;
}

export function leaveChannel(guildId: string): boolean {
  const connection = getVoiceConnection(guildId);

  if (connection) {
    connection.destroy();
    connections.delete(guildId);
    return true;
  }

  return false;
}

export function getConnection(guildId: string): VoiceConnection | undefined {
  return getVoiceConnection(guildId);
}
