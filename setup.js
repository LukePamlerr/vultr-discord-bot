import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { saveGuildKey, getGuildKey } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure guild settings for the Vultr bot')
  .addSubcommand(sub => sub
    .setName('set-key')
    .setDescription('Store the Vultr API key for this server (Admin only)')
    .addStringOption(o => o.setName('key').setDescription('Vultr API key').setRequired(true)))
  .addSubcommand(sub => sub
    .setName('get-key')
    .setDescription('Show whether a Vultr API key is set for this server'))
  .setDMPermission(false);

export async function execute(interaction){
  const sub = interaction.options.getSubcommand();
  if (sub === 'set-key'){
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)){
      return interaction.reply({ content: 'Only server administrators can run this.', ephemeral: true });
    }
    const key = interaction.options.getString('key', true);
    saveGuildKey(interaction.guildId, key);
    return interaction.reply({ content: 'Vultr API key saved for this server.', ephemeral: true });
  }
  if (sub === 'get-key'){
    const key = getGuildKey(interaction.guildId);
    if (!key) return interaction.reply({ content: 'No Vultr API key configured for this server.', ephemeral: true });
    // don't show full key
    const masked = key.length > 8 ? `${key.slice(0,4)}...${key.slice(-4)}` : '***';
    return interaction.reply({ content: `A Vultr API key is configured: ${masked}`, ephemeral: true });
  }
}
