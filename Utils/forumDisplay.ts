import { Client, ChannelType } from 'discord.js';
import { getCollections } from '../mongoDB';
import createOracleEmbed from './createOracleEmbed';
import {
    calculateBattalionTOE,
    countSoldiers,
    getDepletedItems,
    overallDepletion,
    getToeData,
    writeToeData,
} from './battalionUtils';

// ─── Battalion forum post ─────────────────────────────────────────────────────

/**
 * Creates or updates the persistent forum post for a battalion.
 * Silently returns if no battalion forum channel is configured for this guild.
 */
export async function upsertBattalionPost(
    client: Client,
    guildId: string,
    battalion: any
): Promise<void> {
    try {
        const collections = getCollections();
        const guildConfig = await collections.guildConfig.findOne({ guildId });
        const channelId = guildConfig?.battalionForumChannelId;
        if (!channelId) return;

        const forumChannel = await client.channels.fetch(channelId).catch(() => null) as any;
        if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

        const toeData = getToeData();
        const stockpile = await collections.stockpiles.findOne({ name: battalion.stockpileName });
        const stockpileItems: Record<string, number> = (stockpile?.items as any) ?? {};

        const toe = calculateBattalionTOE(battalion, toeData);
        const soldiers = countSoldiers(battalion, toeData);
        const depleted = getDepletedItems(toe, stockpileItems, battalion.depletionThreshold);
        const depletionPct = overallDepletion(toe, stockpileItems);

        const openManifestCount = battalion.openManifestIds?.length ?? 0;
        const manifestNote = openManifestCount > 0 ? `\n📋 **${openManifestCount}** active manifest(s)` : '';
        const statusLine = `Stockpile: **${battalion.stockpileName}**\nStrength: **${soldiers} / 1000** | Depletion: **${depletionPct}%** | Threshold: **${Math.round(battalion.depletionThreshold * 100)}%**${manifestNote}`;

        // Squad composition — each squad gets a field with a link to its TOE post
        const squadFields: { name: string; value: string }[] = [];
        if (battalion.squads.length === 0) {
            squadFields.push({ name: '─── Squad Composition ───', value: 'None configured. Use `/battalion add-squad`.' });
        } else {
            squadFields.push({ name: '─── Squad Composition ───', value: '\u200b' });
            for (const s of battalion.squads) {
                const size: number = toeData[s.squadType]?.size ?? 0;
                const variantDef = toeData[s.squadType]?.[s.variant];
                const toeThreadId: string | undefined = variantDef?.forumThreadId;
                const toeLink = toeThreadId
                    ? `  ·  [View TOE](https://discord.com/channels/${guildId}/${toeThreadId})`
                    : '';
                squadFields.push({
                    name: `${s.count}× ${s.squadType} (${s.variant})`,
                    value: `${size} soldiers/squad  ·  ${s.count * size} soldiers total${toeLink}`,
                });
            }
        }

        // Stockpile status — compact multi-line field(s)
        const itemFields: { name: string; value: string }[] = [];
        if (toe.size === 0) {
            itemFields.push({ name: '─── Stockpile Status ───', value: 'No items — add squads with variants.' });
        } else {
            const lines = Array.from(toe.entries()).map(([item, target]) => {
                const current = stockpileItems[item] ?? 0;
                const pct = target === 0 ? 100 : Math.round((current / target) * 100);
                const icon = depleted.has(item) ? '⚠️' : '✅';
                return `${icon} **${item}**: ${current}/${target} (${pct}%)`;
            });
            const chunkSize = 10;
            for (let i = 0; i < lines.length; i += chunkSize) {
                itemFields.push({
                    name: i === 0 ? '─── Stockpile Status ───' : '\u200b',
                    value: lines.slice(i, i + chunkSize).join('\n'),
                });
            }
        }

        const embed = createOracleEmbed(
            `Battalion: ${battalion.name}`,
            statusLine,
            [...squadFields, ...itemFields],
            ''
        );

        // If the thread exists, edit its starter message
        if (battalion.forumThreadId) {
            try {
                const thread = await client.channels.fetch(battalion.forumThreadId);
                if (thread?.isThread()) {
                    const starterMsg = await (thread as any).fetchStarterMessage();
                    if (starterMsg) {
                        await starterMsg.edit({ embeds: [embed] });
                        return;
                    }
                }
            } catch {
                // Thread was deleted — fall through to create a new one
            }
        }

        // Create a new forum thread
        const thread = await forumChannel.threads.create({
            name: battalion.name,
            message: { embeds: [embed] },
        });
        await collections.battalions.updateOne(
            { name: battalion.name },
            { $set: { forumThreadId: thread.id } }
        );
    } catch (err) {
        console.error('[forumDisplay] upsertBattalionPost error:', err);
    }
}

// ─── Squad TOE forum post ─────────────────────────────────────────────────────

/**
 * Creates or updates the persistent forum post for a squad variant.
 * Silently returns if no squad TOE forum channel is configured.
 * Mutates toeData in-place to store forumThreadId and writes it to disk if a
 * new thread is created.
 */
export async function upsertVariantPost(
    client: Client,
    guildId: string,
    typeName: string,
    variantName: string,
    toeData: any
): Promise<void> {
    try {
        const collections = getCollections();
        const guildConfig = await collections.guildConfig.findOne({ guildId });
        const channelId = guildConfig?.squadToeForumChannelId;
        if (!channelId) return;

        const forumChannel = await client.channels.fetch(channelId).catch(() => null) as any;
        if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) return;

        const typeDef = toeData[typeName];
        if (!typeDef) return;
        const variantDef = typeDef[variantName];
        if (!variantDef) return;

        const size: number = typeDef.size ?? 0;
        const requirements: string[] = variantDef.requirements ?? [];
        const toeEntries = Object.entries<number>(variantDef.TOE ?? {});

        const fields = toeEntries.length === 0
            ? [{ name: 'Items', value: 'No items defined. Use `/squad-type set-item`.' }]
            : toeEntries.map(([item, amt]) => ({
                name: item,
                value: `${amt} crates per squad`,
            }));

        const reqText = requirements.length > 0 ? requirements.join(', ') : 'None';
        const embed = createOracleEmbed(
            `${typeName} — ${variantName}`,
            `**Squad size:** ${size} soldiers/squad\n**Tech requirements:** ${reqText}`,
            fields,
            ''
        );

        // Find or create the tag for this squad type (max 20 tags per forum channel)
        let tagId: string | null = null;
        const existingTag = forumChannel.availableTags?.find((t: any) => t.name === typeName);
        if (existingTag) {
            tagId = existingTag.id;
        } else if ((forumChannel.availableTags?.length ?? 0) < 20) {
            try {
                await forumChannel.setAvailableTags([
                    ...(forumChannel.availableTags ?? []).map((t: any) => ({
                        id: t.id, name: t.name, moderated: t.moderated, emoji: t.emoji,
                    })),
                    { name: typeName, moderated: false },
                ]);
                const fresh = await client.channels.fetch(channelId, { force: true }) as any;
                tagId = fresh.availableTags?.find((t: any) => t.name === typeName)?.id ?? null;
            } catch {
                // Tag creation failed; proceed without tag
            }
        }

        // If the thread exists, edit its starter message
        const existingThreadId: string | undefined = variantDef.forumThreadId;
        if (existingThreadId) {
            try {
                const thread = await client.channels.fetch(existingThreadId);
                if (thread?.isThread()) {
                    const starterMsg = await (thread as any).fetchStarterMessage();
                    if (starterMsg) {
                        await starterMsg.edit({ embeds: [embed] });
                        return;
                    }
                }
            } catch {
                // Thread was deleted — fall through to create a new one
            }
        }

        // Create a new forum thread
        const createOpts: any = {
            name: `${typeName} — ${variantName}`,
            message: { embeds: [embed] },
        };
        if (tagId) createOpts.appliedTags = [tagId];

        const thread = await forumChannel.threads.create(createOpts);

        // Persist the thread ID in toeData
        toeData[typeName][variantName].forumThreadId = thread.id;
        await writeToeData(toeData);
    } catch (err) {
        console.error('[forumDisplay] upsertVariantPost error:', err);
    }
}

// ─── Archive a forum thread (called on battalion/variant delete) ───────────────

export async function archiveForumThread(client: Client, threadId: string): Promise<void> {
    try {
        const thread = await client.channels.fetch(threadId);
        if (thread?.isThread()) {
            await (thread as any).setArchived(true);
        }
    } catch {
        // Thread already gone or inaccessible
    }
}
