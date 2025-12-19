import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Client, GatewayIntentBits, Collection, ActivityType, PermissionsBitField } from 'discord.js';
import { getGuildKey, getInstancesForGuild, upsertInstance, updateInstanceStatus } from './db.js';
import * as vultr from './vultr.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN not set in environment');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

async function loadCommands(){
  const commandsPath = path.resolve('./src/commands');
  if (!fs.existsSync(commandsPath)) return;
  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files){
    const module = await import(pathToFileURL(path.join(commandsPath, file)).href);
    if (module?.data && module?.execute){
      client.commands.set(module.data.name, module);
    }
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  // load commands
  await loadCommands();

  // Periodic status sync and presence update
  setInterval(async () => {
    try{
      // gather counts across guilds tracked in DB
      const allInstances = [];
      for (const guild of client.guilds.cache.values()){
        const guildId = guild.id;
        const apiKey = getGuildKey(guildId);
        if (!apiKey) continue;
        try{
          const res = await vultr.listInstances(apiKey);
          const instances = res.instances || res;
          instances.forEach(inst => {
            // upsert local record for tracking
            const row = {
              instance_id: inst.id || inst.instance_id || inst.uuid || inst.name,
              guild_id: guildId,
              label: inst.label || inst.name || inst.hostname || '',
              status: inst.status || inst.state || '',
              region: inst.region || inst.location || '',
              plan: inst.plan || '',
              created_at: Date.now(),
              metadata: JSON.stringify(inst)
            };
            upsertInstance(row);
            allInstances.push(row);
          });
        }catch(err){
          // ignore per-guild errors
        }
      }

      const running = allInstances.filter(i => /run|active|started/i.test(i.status)).length;
      const total = allInstances.length;
      const statusText = total ? `${running}/${total} VMs running` : 'No tracked VMs';
      await client.user.setActivity(statusText, { type: ActivityType.Watching });

    }catch(err){
      console.error('Status sync error', err);
    }
  }, 60_000); // every minute
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try{
    await cmd.execute(interaction, { db: null, vultr, client });
  }catch(err){
    console.error('Command error', err);
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: 'Error: '+err.message, ephemeral: true });
    else await interaction.reply({ content: 'Error: '+err.message, ephemeral: true });
  }
});

client.login(token);
