import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder } from '@discordjs/builders';
import { stockpileInfo } from '../Utils/createStockpileEmbed';

const techStatus = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const collections = getCollections();
    const configObj = (await collections.config.findOne({}))!;

    const unlockedItems: string[] = configObj.unlockedItems ?? [];

    if (unlockedItems.length === 0) {
        await interaction.editReply({ content: "No tech has been unlocked yet. Use `/unlock` to mark items as available." });
        return true;
    }

    const subCategories: any = NodeCacheObj.get("subCategories");
    const lowerToOriginal: any = NodeCacheObj.get("lowerToOriginal");

    // Build set of lowercased+dotReplaced unlocked item keys
    const unlockedSet = new Set<string>(
        unlockedItems.map(item => item.toLowerCase().replace(/\./g, "_"))
    );

    // Build output grouped by high-level category
    const messages: Array<{ content: string; embeds: EmbedBuilder[] }> = [];

    for (const group of stockpileInfo) {
        const groupEmbeds: EmbedBuilder[] = [];

        for (const cat of group.cats) {
            const catItems: string[] = subCategories[cat.replace("-", "")] ?? [];
            const unlockedInCat = catItems.filter(key => unlockedSet.has(key));
            if (unlockedInCat.length === 0) continue;

            const display = unlockedInCat
                .map(key => lowerToOriginal[key] ?? key)
                .map(name => `\`${name}\``)
                .join("\n");

            groupEmbeds.push(
                new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle(cat.padEnd(44, "-"))
                    .setDescription(display)
            );
        }

        if (groupEmbeds.length > 0) {
            messages.push({ content: `# ${group.name}`, embeds: groupEmbeds });
        }
    }

    if (messages.length === 0) {
        await interaction.editReply({ content: `${unlockedItems.length} items are unlocked but none matched known categories.` });
        return true;
    }

    await interaction.editReply({ content: `**Tech Status — ${unlockedItems.length} items unlocked**` });
    for (const msg of messages) {
        await interaction.followUp({ content: msg.content, embeds: msg.embeds, ephemeral: false });
    }

    return true;
}

export default techStatus;
