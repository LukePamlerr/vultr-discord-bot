import { SlashCommandBuilder } from 'discord.js';
import { getGuildKey, getInstancesForGuild } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('vm-list')
  .setDescription('List tracked virtual machines for this server')
  .setDMPermission(false);

export async function execute(interaction, { vultr }){
  await interaction.deferReply({ ephemeral: true });
  const apiKey = getGuildKey(interaction.guildId);
  if (!apiKey) return interaction.editReply({ content: 'No Vultr API key configured for this server. Use /setup set-key (Admin).' });
  try{
    // Prefer the Vultr API fresh list
    const res = await vultr.listInstances(apiKey);
    const instances = res.instances || res;
    if (!instances || instances.length === 0) return interaction.editReply({ content: 'No instances found.' });
    const lines = instances.map(i => `• ${i.label || i.name || i.hostname || i.id || i.instance_id} — ${i.status || i.state || 'unknown'} (ID: ${i.id || i.instance_id})`);
    const chunk = lines.join('\n');
    return interaction.editReply({ content: `Instances:\n${chunk}` });
  }catch(err){
    // fallback to local DB
    const local = getInstancesForGuild(interaction.guildId);
    if (!local || local.length === 0) return interaction.editReply({ content: `Failed to list via Vultr: ${err.message}` });
    const lines = local.map(i => `• ${i.label} — ${i.status} (ID: ${i.instance_id})`);
    return interaction.editReply({ content: `Instances (local):\n${lines.join('\n')}` });
  }
}
