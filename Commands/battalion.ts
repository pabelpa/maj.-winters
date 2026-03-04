import { ChatInputCommandInteraction, ChannelType, Client } from 'discord.js';
import { getCollections } from '../mongoDB';
import createOracleEmbed from '../Utils/createOracleEmbed';
import checkPermissions from '../Utils/checkPermissions';
import {
    getToeData,
    getVehiclesData,
    calculateBattalionTOE,
    countSoldiers,
    getDepletedItems,
    overallDepletion,
    isVehicleAvailable,
    createBattalionManifests,
} from '../Utils/battalionUtils';
import { upsertBattalionPost, archiveForumThread } from '../Utils/forumDisplay';

// ─── Helper: check if all open manifests are closed ──────────────────────────

async function allManifestsClosed(manifestIds: string[]): Promise<boolean> {
    const collections = getCollections();
    for (const id of manifestIds) {
        const ticket = await collections.tickets.findOne({ ticketId: id });
        if (ticket && !ticket.closed) return false;
    }
    return true;
}

// ─── /battalion create ────────────────────────────────────────────────────────

const battalionCreate = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const name = interaction.options.getString('name', true).trim();
    const stockpileName = interaction.options.getString('stockpile', true).trim();

    const collections = getCollections();

    const existing = await collections.battalions.findOne({ name });
    if (existing) {
        await interaction.editReply({ content: `A battalion named **${name}** already exists.` });
        return false;
    }

    const stockpile = await collections.stockpiles.findOne({ name: stockpileName });
    if (!stockpile) {
        await interaction.editReply({ content: `Stockpile **${stockpileName}** not found. Each battalion must be associated with an existing stockpile.` });
        return false;
    }

    const battalionDoc = {
        guildId: interaction.guildId as string,
        name,
        stockpileName,
        squads: [],
        depletionThreshold: 0.3,
        createdAt: new Date(),
        createdBy: interaction.user.username,
    };

    await collections.battalions.insertOne(battalionDoc);

    await interaction.editReply({
        content: `Battalion **${name}** created and linked to stockpile **${stockpileName}**.\n\nAdd squads with \`/battalion add-squad\` and set a depletion threshold with \`/battalion set-threshold\` (default: 30%).`,
    });

    // Update forum post in background (best-effort)
    upsertBattalionPost(client, interaction.guildId as string, battalionDoc);

    return true;
};

// ─── /battalion set-forum ─────────────────────────────────────────────────────

const battalionSetForum = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const channel = interaction.options.getChannel('channel', true);
    if (channel.type !== ChannelType.GuildForum) {
        await interaction.editReply({ content: 'The selected channel must be a **Forum** channel.' });
        return false;
    }

    const guildId = interaction.guildId as string;
    const collections = getCollections();

    await collections.guildConfig.updateOne(
        { guildId },
        { $set: { battalionForumChannelId: channel.id } },
        { upsert: true }
    );

    // Clear old thread IDs so posts are (re)created in the new channel
    await collections.battalions.updateMany({ guildId }, { $unset: { forumThreadId: '' } });
    const battalions = await collections.battalions.find({ guildId }).toArray();

    await interaction.editReply({
        content: `Battalion forum set to <#${channel.id}>. Creating posts for **${battalions.length}** battalion(s)…`,
    });

    for (const bat of battalions) {
        await upsertBattalionPost(client, guildId, bat);
    }

    await interaction.followUp({ content: `Done — **${battalions.length}** battalion post(s) created in <#${channel.id}>.` });
    return true;
};

// ─── /battalion status ────────────────────────────────────────────────────────

const battalionStatus = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const collections = getCollections();
    const toeData = getToeData();

    const battalions = await collections.battalions.find({}).toArray();
    if (battalions.length === 0) {
        await interaction.editReply({ content: 'No battalions configured. Use `/battalion create` to add one.' });
        return false;
    }

    const fields = await Promise.all(battalions.map(async (b: any) => {
        const stockpile = await collections.stockpiles.findOne({ name: b.stockpileName });
        const stockpileItems: Record<string, number> = (stockpile?.items as any) ?? {};
        const toe = calculateBattalionTOE(b, toeData);
        const soldiers = countSoldiers(b, toeData);
        const depletionPct = overallDepletion(toe, stockpileItems);
        const manifestCount = b.openManifestIds?.length ?? 0;
        const manifestNote = manifestCount > 0 ? ` | 📋 ${manifestCount} manifest(s)` : '';
        return {
            name: b.name,
            value: `Stockpile: **${b.stockpileName}** | Strength: ${soldiers}/1000 | Depletion: ${depletionPct}%${manifestNote}`,
        };
    }));

    const embed = createOracleEmbed('Battalion Status', `${battalions.length} battalion(s) configured`, fields, '');
    await interaction.editReply({ embeds: [embed] });
    return true;
};

// ─── /battalion delete ────────────────────────────────────────────────────────

const battalionDelete = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const name = interaction.options.getString('name', true).trim();
    const collections = getCollections();

    const battalion = await collections.battalions.findOne({ name });
    if (!battalion) {
        await interaction.editReply({ content: `Battalion **${name}** not found.` });
        return false;
    }

    await collections.battalions.deleteOne({ name });

    if (battalion.forumThreadId) {
        archiveForumThread(client, battalion.forumThreadId as string);
    }

    await interaction.editReply({ content: `Battalion **${name}** deleted.` });
    return true;
};

// ─── /battalion set-threshold ─────────────────────────────────────────────────

const battalionSetThreshold = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const name = interaction.options.getString('name', true).trim();
    const percent = interaction.options.getInteger('percent', true);
    const collections = getCollections();

    const result = await collections.battalions.updateOne(
        { name },
        { $set: { depletionThreshold: percent / 100 } }
    );

    if (result.matchedCount === 0) {
        await interaction.editReply({ content: `Battalion **${name}** not found.` });
        return false;
    }

    await interaction.editReply({ content: `Battalion **${name}** depletion threshold set to **${percent}%**.` });

    const battalion = await collections.battalions.findOne({ name });
    if (battalion) upsertBattalionPost(client, interaction.guildId as string, battalion);

    return true;
};

// ─── /battalion add-squad ─────────────────────────────────────────────────────

const battalionAddSquad = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const battalionName = interaction.options.getString('battalion', true).trim();
    const squadType = interaction.options.getString('squad_type', true).trim();
    const variant = interaction.options.getString('variant', true).trim();
    const count = interaction.options.getInteger('count', true);
    const toeData = getToeData();

    if (!toeData[squadType]) {
        await interaction.editReply({ content: `Squad type **${squadType}** not found. Use \`/squad-type view\` to see available types.` });
        return false;
    }
    if (!toeData[squadType][variant]) {
        await interaction.editReply({ content: `Variant **${variant}** not found in **${squadType}**. Use \`/squad-type view\` to see available variants.` });
        return false;
    }

    const collections = getCollections();
    const battalion = await collections.battalions.findOne({ name: battalionName });
    if (!battalion) {
        await interaction.editReply({ content: `Battalion **${battalionName}** not found.` });
        return false;
    }

    const existingIdx = (battalion.squads as any[]).findIndex(
        (s) => s.squadType === squadType && s.variant === variant
    );

    if (existingIdx >= 0) {
        const updatedSquads = [...battalion.squads as any[]];
        updatedSquads[existingIdx] = { squadType, variant, count: updatedSquads[existingIdx].count + count };
        await collections.battalions.updateOne({ _id: battalion._id }, { $set: { squads: updatedSquads } });
    } else {
        await collections.battalions.updateOne(
            { _id: battalion._id },
            { $push: { squads: { squadType, variant, count } } }
        );
    }

    const size = toeData[squadType].size ?? 0;
    await interaction.editReply({
        content: `Added **${count}× ${squadType} (${variant})** to battalion **${battalionName}** — ${count * size} soldiers from this entry.`,
    });

    const updated = await collections.battalions.findOne({ _id: battalion._id });
    if (updated) upsertBattalionPost(client, interaction.guildId as string, updated);

    return true;
};

// ─── /battalion remove-squad ──────────────────────────────────────────────────

const battalionRemoveSquad = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const member = interaction.guild!.members.cache.get(interaction.user.id)!;
    if (!await checkPermissions(interaction, 'admin', member)) return false;

    const battalionName = interaction.options.getString('battalion', true).trim();
    const squadType = interaction.options.getString('squad_type', true).trim();
    const variant = interaction.options.getString('variant', true).trim();

    const collections = getCollections();
    const battalion = await collections.battalions.findOne({ name: battalionName });
    if (!battalion) {
        await interaction.editReply({ content: `Battalion **${battalionName}** not found.` });
        return false;
    }

    const newSquads = (battalion.squads as any[]).filter(
        (s) => !(s.squadType === squadType && s.variant === variant)
    );

    if (newSquads.length === (battalion.squads as any[]).length) {
        await interaction.editReply({ content: `No entry for **${squadType} (${variant})** found in battalion **${battalionName}**.` });
        return false;
    }

    await collections.battalions.updateOne({ _id: battalion._id }, { $set: { squads: newSquads } });
    await interaction.editReply({ content: `Removed **${squadType} (${variant})** from battalion **${battalionName}**.` });

    const updated = await collections.battalions.findOne({ _id: battalion._id });
    if (updated) upsertBattalionPost(client, interaction.guildId as string, updated);

    return true;
};

// ─── /battalion request ───────────────────────────────────────────────────────

const battalionRequest = async (
    interaction: ChatInputCommandInteraction,
    client: Client
): Promise<boolean> => {
    const name = interaction.options.getString('name', true).trim();
    const vehicleKey = interaction.options.getString('vehicle_type') ?? 'truck';

    const collections = getCollections();
    const toeData = getToeData();
    const vehicles = getVehiclesData();

    // Validate vehicle type
    if (!vehicles[vehicleKey]) {
        await interaction.editReply({ content: `Unknown vehicle type \`${vehicleKey}\`. Check \`vehicles.json\` for valid options.` });
        return false;
    }

    // Tech gate check for train (or any gated vehicle)
    const available = await isVehicleAvailable(vehicleKey);
    if (!available) {
        const techName = vehicles[vehicleKey].techRequired;
        await interaction.editReply({ content: `**${vehicles[vehicleKey].label}** is not yet available — unlock the **${techName}** tech first with \`/unlock\`.` });
        return false;
    }

    const battalion = await collections.battalions.findOne({ name });
    if (!battalion) {
        await interaction.editReply({ content: `Battalion **${name}** not found.` });
        return false;
    }

    // Check if existing manifests are still open
    const openIds: string[] = battalion.openManifestIds ?? [];
    if (openIds.length > 0) {
        const closed = await allManifestsClosed(openIds);
        if (!closed) {
            await interaction.editReply({
                content: `Battalion **${name}** still has **${openIds.length}** active manifest(s). Resolve them before requesting more.`,
            });
            return false;
        }
        // All closed — clear them
        await collections.battalions.updateOne({ _id: battalion._id }, { $unset: { openManifestIds: '' } });
    }

    const stockpile = await collections.stockpiles.findOne({ name: battalion.stockpileName });
    const stockpileItems: Record<string, number> = (stockpile?.items as any) ?? {};
    const toe = calculateBattalionTOE(battalion as any, toeData);

    if (toe.size === 0) {
        await interaction.editReply({ content: `Battalion **${name}** has no squads with items in their TOE. Add squads with variants first.` });
        return false;
    }

    const depleted = getDepletedItems(toe, stockpileItems, battalion.depletionThreshold);
    if (depleted.size === 0) {
        await interaction.editReply({ content: `Battalion **${name}** is fully stocked — no items below the ${Math.round(battalion.depletionThreshold * 100)}% threshold.` });
        return false;
    }

    const ticketIds = await createBattalionManifests(
        client,
        interaction.guildId as string,
        name,
        battalion.stockpileName,
        depleted,
        vehicleKey
    );

    if (ticketIds.length === 0) {
        await interaction.editReply({ content: 'Failed to create manifests. Check bot permissions and configuration.' });
        return false;
    }

    await collections.battalions.updateOne(
        { _id: battalion._id },
        { $set: { openManifestIds: ticketIds } }
    );

    const vehicleLabel = vehicles[vehicleKey].label;
    await interaction.editReply({
        content: `**${ticketIds.length}** manifest(s) created for battalion **${name}** using **${vehicleLabel}** — covering **${depleted.size}** depleted item(s).`,
    });

    const updated = await collections.battalions.findOne({ _id: battalion._id });
    if (updated) upsertBattalionPost(client, interaction.guildId as string, updated);

    return true;
};

// ─── Subcommand dispatch ──────────────────────────────────────────────────────

export const battalion = {
    create:           battalionCreate,
    'set-forum':      battalionSetForum,
    status:           battalionStatus,
    delete:           battalionDelete,
    'set-threshold':  battalionSetThreshold,
    'add-squad':      battalionAddSquad,
    'remove-squad':   battalionRemoveSquad,
    request:          battalionRequest,
};
