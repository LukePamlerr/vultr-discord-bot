# Vultr Discord Bot

A Discord bot to create and manage Vultr Virtual Machines via slash commands. Built using Node.js and discord.js v14.

Quick start:

1. Copy `.env.example` to `.env` and fill `DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID` and `GLOBAL_VULTR_API_KEY`.
2. Install dependencies:

```bash
npm install
```

3. Register commands (for a guild during development):

```bash
node deploy-commands.js
```

4. Start the bot:

```bash
npm start
```

Commands (slash-only):
- `/setup set-key` - (server admin) store Vultr API key for the guild
- `/vm create` - create a new VM (asks for region/plan/os)
- `/vm list` - list VMs tracked for this guild
- `/vm info` - show info for a tracked VM
- `/vm start` - (admin) start an instance
- `/vm stop` - (admin) stop an instance
- `/vm pause` - (admin) power off/halt an instance

Notes:
- This project stores per-guild API keys and instance metadata in a SQLite database (file configurable via `DATABASE_FILE`).
- The Vultr API has many options; the bot forwards the region/plan/os fields directly to the Vultr create endpoint. You may need to provide valid values.
- Verify your Vultr endpoint behavior in `src/vultr.js` if Vultr changes their API.
