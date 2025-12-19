import { SlashCommandBuilder } from 'discord.js';
import { getGuildKey, upsertInstance } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('vm-create')
  .setDescription('Create a new Vultr virtual machine')
  .addStringOption(o => o.setName('region').setDescription('Region (e.g. ewr)').setRequired(true))
  .addStringOption(o => o.setName('plan').setDescription('Plan (e.g. vc2-1c-1gb)').setRequired(true))
  .addStringOption(o => o.setName('os').setDescription('OS slug or snapshot id').setRequired(false))
  .addStringOption(o => o.setName('label').setDescription('Label for the instance').setRequired(false))
  .setDMPermission(false);

export async function execute(interaction, { vultr }){
  await interaction.deferReply({ ephemeral: true });
  const apiKey = getGuildKey(interaction.guildId);
  if (!apiKey) return interaction.editReply({ content: 'No Vultr API key configured for this server. Use /setup set-key (Admin).' });
  const region = interaction.options.getString('region', true);
  const plan = interaction.options.getString('plan', true);
  const os = interaction.options.getString('os');
  const label = interaction.options.getString('label');
  try{
    const res = await vultr.createInstance(apiKey, { region, plan, os, label });
    const inst = res.instance || res; // adapt to API shape
    const id = inst.id || inst.instance_id || inst.uuid || inst.name;
    const row = {
      instance_id: id,
      guild_id: interaction.guildId,
      label: inst.label || label || id,
      status: inst.status || inst.state || 'unknown',
      region: inst.region || region,
      plan: inst.plan || plan,
      created_at: Date.now(),
      metadata: JSON.stringify(inst)
    };
    upsertInstance(row);
    return interaction.editReply({ content: `Created instance ${row.label} (ID: ${row.instance_id}).` });
  }catch(err){
    return interaction.editReply({ content: `Failed to create instance: ${err.message}` });
  }
}
