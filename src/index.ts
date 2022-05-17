import "dotenv/config";
import { Intents } from "discord.js";
import path from "path";
import { SlashasaurusClient } from "slashasaurus";

const client = new SlashasaurusClient(
	{
		intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_SCHEDULED_EVENTS],
	},
	{
		devServerId: "561807594516381749",
	}
);

client.once("ready", () => {
	console.log(`Client ready and logged in as ${client.user?.tag}`);
	client.registerCommandsFrom(
		path.join(__dirname, "commands"),
		process.env.NODE_ENV === "development" ? "dev" : "global"
	);
});

client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
	if (newEvent.isActive() && !oldEvent.isActive()) {
		// The event just started, check if it's from us
		if (newEvent.creatorId === client.user?.id) {
			// This event was made by us, we need to choose winner(s)
			// Get the number of winners
			const winners = parseInt(newEvent.entityMetadata.location!.split(" ")[0]);
			// Get the users who are interested
			const users = await newEvent.fetchSubscribers();
			// Pick the winners
			const winningUsers = [...users.values()]
				.sort(() => Math.random() - 0.5)
				.slice(0, winners);
			// Get the channel
			const channelId = newEvent.description!.match(/<#(\d+)>/)![1];
			const channel = await newEvent.guild?.channels.fetch(channelId);
			if (
				!channel ||
				!channel.isText() ||
				!channel.permissionsFor(client.user!)?.has("SEND_MESSAGES")
			) {
				console.error(
					`Could not find channel or I cannot send messages in ${channelId}`
				);
				return;
			}
			// Send the message
			await channel.send({
				content: `${newEvent.name} has ended!

Winner${winners > 1 ? "s" : ""}:
${winningUsers.map((user) => `- <@${user.user.id}>`).join("\n")}`,
			});
			newEvent.edit({
				status: "COMPLETED",
			});
		}
	}
});

client.login(process.env.TOKEN);
