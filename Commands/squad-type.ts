import { ChatInputCommandInteraction, ChannelType, Client } from 'discord.js';
import checkPermissions from '../Utils/checkPermissions';
import { getToeData, writeToeData } from '../Utils/battalionUtils';
import { upsertVariantPost, archiveForumThread } from '../Utils/forumDisplay';

// ─── /squad-type create ───────────────────────────────────────────────────────

const squadTypeCreate = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const name = interaction.options.getString('name', true).trim();
    const size = interaction.options.getInteger('size', true);
    const toeData = getToeData();

    if (toeData[name]) {
        await interaction.editReply({ content: `Squad type **${name}** already exists.` });
        return false;
    }

    toeData[name] = { size };
    await writeToeData(toeData);

    await interaction.editReply({
        content: `Squad type **${name}** created with size **${size}** soldiers.\nAdd variants with \`/squad-type add-variant\` and items with \`/squad-type set-item\`.`,
    });
    return true;
};

// ─── /squad-type set-forum ────────────────────────────────────────────────────

const squadTypeSetForum = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const channel = interaction.options.getChannel('channel', true);
    if (channel.type !== ChannelType.GuildForum) {
        await interaction.editReply({ content: 'The selected channel must be a **Forum** channel.' });
        return false;
    }

    const guildId = interaction.guildId as string;
    const { getCollections } = await import('../mongoDB');
    const collections = getCollections();

    await collections.guildConfig.updateOne(
        { guildId },
        { $set: { squadToeForumChannelId: channel.id } },
        { upsert: true }
    );

    // Clear existing thread IDs in toeData so posts are (re)created in the new channel
    const toeData = getToeData();
    let variantCount = 0;
    for (const typeName of Object.keys(toeData)) {
        const typeDef = toeData[typeName];
        for (const key of Object.keys(typeDef)) {
            if (key === 'size') continue;
            delete typeDef[key].forumThreadId;
            variantCount++;
        }
    }
    await writeToeData(toeData);

    await interaction.editReply({
        content: `Squad TOE forum set to <#${channel.id}>. Creating posts for **${variantCount}** variant(s)…`,
    });

    // Re-create posts for all variants sequentially
    const freshToeData = getToeData();
    for (const typeName of Object.keys(freshToeData)) {
        const typeDef = freshToeData[typeName];
        for (const key of Object.keys(typeDef)) {
            if (key === 'size') continue;
            await upsertVariantPost(client, guildId, typeName, key, freshToeData);
        }
    }

    await interaction.followUp({ content: `Done — **${variantCount}** variant post(s) created in <#${channel.id}>.` });
    return true;
};

// ─── /squad-type delete ───────────────────────────────────────────────────────

const squadTypeDelete = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const name = interaction.options.getString('name', true).trim();
    const toeData = getToeData();

    if (!toeData[name]) {
        await interaction.editReply({ content: `Squad type **${name}** not found.` });
        return false;
    }

    // Archive forum threads for all variants of this type
    const typeDef = toeData[name];
    for (const key of Object.keys(typeDef)) {
        if (key === 'size') continue;
        const threadId = typeDef[key].forumThreadId;
        if (threadId) archiveForumThread(client, threadId);
    }

    delete toeData[name];
    await writeToeData(toeData);

    await interaction.editReply({ content: `Squad type **${name}** deleted.` });
    return true;
};

// ─── /squad-type add-variant ──────────────────────────────────────────────────

const squadTypeAddVariant = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const typeName = interaction.options.getString('type', true).trim();
    const variantName = interaction.options.getString('variant', true).trim();
    const toeData = getToeData();

    if (!toeData[typeName]) {
        await interaction.editReply({ content: `Squad type **${typeName}** not found.` });
        return false;
    }
    if (toeData[typeName][variantName]) {
        await interaction.editReply({ content: `Variant **${variantName}** already exists in **${typeName}**.` });
        return false;
    }

    toeData[typeName][variantName] = { requirements: [], TOE: {} };
    await writeToeData(toeData);

    await interaction.editReply({
        content: `Variant **${variantName}** added to **${typeName}**.\nAdd items with \`/squad-type set-item\`.`,
    });

    upsertVariantPost(client, interaction.guildId as string, typeName, variantName, toeData);

    return true;
};

// ─── /squad-type set-item ─────────────────────────────────────────────────────

const squadTypeSetItem = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const typeName = interaction.options.getString('type', true).trim();
    const variantName = interaction.options.getString('variant', true).trim();
    const item = interaction.options.getString('item', true).trim();
    const amount = interaction.options.getNumber('amount', true);
    const toeData = getToeData();

    if (!toeData[typeName]) {
        await interaction.editReply({ content: `Squad type **${typeName}** not found.` });
        return false;
    }
    if (!toeData[typeName][variantName]) {
        await interaction.editReply({ content: `Variant **${variantName}** not found in **${typeName}**.` });
        return false;
    }

    toeData[typeName][variantName].TOE[item] = amount;
    await writeToeData(toeData);

    await interaction.editReply({
        content: `Set **${item}**: **${amount}** crates/squad in **${typeName} → ${variantName}**.`,
    });

    upsertVariantPost(client, interaction.guildId as string, typeName, variantName, toeData);

    return true;
};

// ─── /squad-type remove-item ──────────────────────────────────────────────────

const squadTypeRemoveItem = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const typeName = interaction.options.getString('type', true).trim();
    const variantName = interaction.options.getString('variant', true).trim();
    const item = interaction.options.getString('item', true).trim();
    const toeData = getToeData();

    if (!toeData[typeName]?.[variantName]?.TOE?.[item]) {
        await interaction.editReply({ content: `Item **${item}** not found in **${typeName} → ${variantName}**.` });
        return false;
    }

    delete toeData[typeName][variantName].TOE[item];
    await writeToeData(toeData);

    await interaction.editReply({ content: `Removed **${item}** from **${typeName} → ${variantName}**.` });

    upsertVariantPost(client, interaction.guildId as string, typeName, variantName, toeData);

    return true;
};

// ─── Subcommand dispatch ──────────────────────────────────────────────────────

export const squadType = {
    create:         squadTypeCreate,
    'set-forum':    squadTypeSetForum,
    delete:         squadTypeDelete,
    'add-variant':  squadTypeAddVariant,
    'set-item':     squadTypeSetItem,
    'remove-item':  squadTypeRemoveItem,
};
