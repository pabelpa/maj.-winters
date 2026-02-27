import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';

const unlock = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, "admin", member)) return false;

    const tech = interaction.options.getString("tech")!;
    const vic_tech: any = NodeCacheObj.get("vic_tech");
    const inf_tech: any = NodeCacheObj.get("inf_tech");

    const techItems: string[] | undefined = vic_tech[tech] ?? inf_tech[tech];
    if (!techItems) {
        await interaction.editReply({ content: `Tech \`${tech}\` was not found in the database.` });
        return false;
    }

    const collections = getCollections();
    const configObj = (await collections.config.findOne({}))!;

    const currentItems: string[] = configObj.unlockedItems ?? [];
    const newItems = techItems.filter(item => !currentItems.includes(item));

    if (newItems.length === 0) {
        await interaction.editReply({ content: `All items from \`${tech}\` are already unlocked.` });
        return false;
    }

    const updatedItems = [...currentItems, ...newItems];
    await collections.config.updateOne({}, { $set: { unlockedItems: updatedItems } });
    NodeCacheObj.set("unlockedItems", updatedItems);

    await interaction.editReply({
        content: `**${tech}** unlocked! The following items are now available:\n${newItems.map(i => `- \`${i}\``).join("\n")}`
    });

    return true;
}

export default unlock;
