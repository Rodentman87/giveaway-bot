import { Message, PermissionFlagsBits } from "discord.js";
import { MessageCommand } from "slashasaurus";
import { shuffle } from "../../shuffle";

export default new MessageCommand(
	{
		name: "reroll",
		defaultMemberPermissions: PermissionFlagsBits.ManageEvents,
	},
	async (interaction, client) => {
		if (
			interaction.targetMessage.author.id !== client.user.id ||
			!interaction.inGuild()
		) {
			return interaction.reply({
				content:
					"This command can only be used on this bot's messages in guilds",
				ephemeral: true,
			});
		}

		const id =
			interaction.targetMessage.content.match(/\((\d+)\) has ended!/)![1];

		await interaction.reply({
			content: `Rerolling giveaway`,
			ephemeral: true,
		});

		const event = await interaction.guild!.scheduledEvents.fetch(id);

		// Get the total number of winners
		const winners = parseInt(event.entityMetadata!.location!.split(" ")[0]);
		// Get the users who are interested
		const users: string[] = [];
		let nextGroup = await event.fetchSubscribers({
			limit: 100,
		});
		while (nextGroup.size > 0) {
			users.push(...nextGroup.map((u) => u.user.id).values());
			nextGroup = await event.fetchSubscribers({
				limit: 100,
				after: nextGroup.lastKey()!,
			});
		}
		// Pick the winners
		const winningUsers = shuffle([...users.values()]).slice(0, winners);

		// Edit the message
		return await (interaction.targetMessage as Message).edit({
			content: `${event.name} (${event.id}) has ended!

Winner${winners > 1 ? "s" : ""}:
${winningUsers.map((id) => `- <@${id}>`).join("\n")}`,
		});
	}
);
