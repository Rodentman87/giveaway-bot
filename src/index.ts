import "dotenv/config";
import { Intents } from 'discord.js';
import path from 'path';
import { SlashasaurusClient } from 'slashasaurus';

const client = new SlashasaurusClient(
	{
		intents: [Intents.FLAGS.GUILDS],
	},
	{
		devServerId: '561807594516381749',
	}
);

client.once('ready', () => {
	console.log(`Client ready and logged in as ${client.user?.tag}`);
	client.registerCommandsFrom(
		path.join(__dirname, 'commands'),
		process.env.NODE_ENV === 'development' ? 'dev' : 'global'
	);
});

client.login(process.env.TOKEN);