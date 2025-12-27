import { Client, GatewayIntentBits, REST, Routes, MessageFlags } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './commands';

dotenv.config();

// Initialize encryption library for voice connections
// @discordjs/voice requires one of: sodium-native, sodium, libsodium-wrappers, or tweetnacl
// Priority: libsodium-wrappers (pure JS, no compilation needed) > tweetnacl
// @discordjs/voice will automatically detect and use the available library
async function initializeEncryption() {
  try {
    // Try libsodium-wrappers first (pure JS, no compilation needed)
    const libsodium = require('libsodium-wrappers');
    // libsodium-wrappers needs to be initialized asynchronously
    await libsodium.ready;
    console.log('✓ Loaded and initialized libsodium-wrappers for voice encryption');
    return true;
  } catch (libsodiumError) {
    // Fallback to tweetnacl
    try {
      require('tweetnacl');
      console.log('✓ Loaded tweetnacl for voice encryption');
      return true;
    } catch (tweetnaclError) {
      console.warn('⚠️ No encryption library found. Voice connections may fail.');
      console.warn('⚠️ Install libsodium-wrappers: npm install libsodium-wrappers');
      return false;
    }
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates, // Required to read member.voice.channel
  ],
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Register slash commands on bot ready
client.once('clientReady', async () => {
  console.log(`Bot is ready! Logged in as ${client.user?.tag}`);
  console.log(`Bot ID: ${client.user?.id}`);

  // Build command data from all registered commands
  const commandsData = Object.values(commands).map((cmd) => {
    try {
      const json = cmd.data.toJSON();
      console.log(`✓ Prepared command: ${json.name} - ${json.description}`);
      return json;
    } catch (error) {
      console.error(`✗ Failed to prepare command:`, error);
      return null;
    }
  }).filter((cmd): cmd is any => cmd !== null);

  console.log(`\nTotal commands to register: ${commandsData.length}`);
  console.log(`Command names: ${commandsData.map(c => c.name).join(', ')}\n`);

  const rest = new REST().setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    if (client.user) {
      // Clear global commands to prevent duplicates
      try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        console.log('✓ Cleared global commands');
      } catch (clearError) {
        console.warn('Failed to clear global commands (this is okay if there were none):', clearError);
      }

      // Register guild-specific commands for instant updates
      // Get all guilds the bot is in
      const guilds = client.guilds.cache;
      console.log(`\nRegistering commands in ${guilds.size} guild(s) for instant updates...`);

      for (const [guildId, guild] of guilds) {
        try {
          const guildResult = await rest.put(
            Routes.applicationGuildCommands(client.user.id, guildId),
            { body: commandsData }
          ) as any[];

          console.log(`✓ Registered ${guildResult.length} commands in guild: ${guild.name} (${guildId})`);
        } catch (guildError) {
          console.error(`Failed to register commands in guild ${guild.name}:`, guildError);
        }
      }

      console.log('\n✅ All commands registered! They should be available immediately in your server(s).');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
});

// Handle slash command interactions
client.on('interactionCreate', async (interaction) => {
  console.log('Interaction received:', interaction.type, interaction.isChatInputCommand() ? interaction.commandName : 'not a chat command');

  if (!interaction.isChatInputCommand()) return;

  const command = commands[interaction.commandName];
  console.log(`Command lookup: ${interaction.commandName}`, command ? 'found' : 'not found');
  console.log('Available commands:', Object.keys(commands));

  if (!command) {
    console.error(`Command not found: ${interaction.commandName}`);
    await interaction.reply({
      content: '❌ Unknown command!',
      flags: MessageFlags.Ephemeral,
    }).catch(err => console.error('Failed to reply:', err));
    return;
  }

  try {
    console.log(`Executing command: ${interaction.commandName}`);
    await command.execute(interaction);
    console.log(`Command executed successfully: ${interaction.commandName}`);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);

    // Try to reply with error if interaction is still valid
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: '❌ An error occurred while processing your command.',
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        // Interaction may have expired, just log it
        console.error('Failed to send error reply:', replyError);
      }
    } else if (interaction.deferred && !interaction.replied) {
      try {
        await interaction.editReply({
          content: '❌ An error occurred while processing your command.',
        });
      } catch (editError) {
        console.error('Failed to send error edit:', editError);
      }
    }
  }
});

// Handle connection errors
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

client.on('disconnect', () => {
  console.warn('Bot disconnected from Discord');
});

client.on('reconnecting', () => {
  console.log('Bot reconnecting to Discord...');
});

// Start the bot after initializing encryption
(async () => {
  console.log('Initializing encryption library...');
  await initializeEncryption();
  console.log('Starting bot...\n');
  
  client.login(token).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1);
  });
})();
