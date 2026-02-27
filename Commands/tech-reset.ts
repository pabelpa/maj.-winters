import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';

const techReset = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, "admin", member)) return false;

    const collections = getCollections();
    await collections.config.updateOne({}, { $set: { unlockedItems: [] } });
    NodeCacheObj.set("unlockedItems", []);

    await interaction.editReply({ content: "All tech unlocks have been reset. The available items list is now empty." });
    return true;
}

export default techReset;
