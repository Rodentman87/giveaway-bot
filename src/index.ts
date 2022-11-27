import "dotenv/config";
import {
	GatewayIntentBits,
	GuildScheduledEventStatus,
	PermissionFlagsBits,
} from "discord.js";
import path from "path";
import { SlashasaurusClient } from "slashasaurus";
import { shuffle } from "./shuffle";

const client = new SlashasaurusClient(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents],
	},
	{}
);

client.once("ready", () => {
	console.log(`Client ready and logged in as ${client.user?.tag}`);
	client.registerCommandsFrom(
		path.join(__dirname, "commands"),
		true,
		process.env.TOKEN!
	);
});

client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
	if (!oldEvent) return;
	if (newEvent.isActive() && !oldEvent.isActive()) {
		// The event just started, check if it's from us
		if (newEvent.creatorId === client.user?.id) {
			// This event was made by us, we need to choose winner(s)
			// Get the number of winners
			const winners = parseInt(
				newEvent.entityMetadata!.location!.split(" ")[0]
			);
			// Get the users who are interested
			const users = await newEvent.fetchSubscribers();
			// Pick the winners
			const winningUsers = shuffle([...users.values()]).slice(0, winners);
			// Get the channel
			const channelId = newEvent.description!.match(/<#(\d+)>/)![1];
			const channel = await newEvent.guild?.channels.fetch(channelId);
			if (
				!channel ||
				!channel.isTextBased() ||
				!channel
					.permissionsFor(client.user!)
					?.has(PermissionFlagsBits.SendMessages)
			) {
				console.error(
					`Could not find channel or I cannot send messages in ${channelId}`
				);
				return;
			}
			// Send the message
			await channel.send({
				content: `${newEvent.name} (${newEvent.id}) has ended!

Winner${winners > 1 ? "s" : ""}:
${winningUsers.map((user) => `- <@${user.user.id}>`).join("\n")}`,
			});
			newEvent.edit({
				status: GuildScheduledEventStatus.Completed,
			});
		}
	}
});

client.login(process.env.TOKEN);
