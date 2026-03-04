import { Client, ChannelType, PermissionFlagsBits, ThreadAutoArchiveDuration } from 'discord.js';
import { getCollections, Battalion } from '../mongoDB';
import createOracleEmbed from './createOracleEmbed';
import crypto from 'crypto';
import fs from 'fs';

// ─── Data paths (relative to cwd = project root) ─────────────────────────────
const TOE_PATH = 'toe.json';

// ─── Cache helpers ────────────────────────────────────────────────────────────

export function getToeData(): any {
    return NodeCacheObj.get('toe') ?? {};
}

export function getProductionData(): Map<string, any> {
    return NodeCacheObj.get('production') ?? new Map();
}

export function getVehiclesData(): any {
    return NodeCacheObj.get('vehicles') ?? {};
}

export async function writeToeData(data: any): Promise<void> {
    await fs.promises.writeFile(TOE_PATH, JSON.stringify(data, null, 4), 'utf-8');
    NodeCacheObj.set('toe', data);
}

// ─── TOE calculations ─────────────────────────────────────────────────────────

// Returns total crates needed per item for a fully configured battalion
export function calculateBattalionTOE(battalion: Battalion, toeData: any): Map<string, number> {
    const totals = new Map<string, number>();
    for (const squad of battalion.squads) {
        const typeDef = toeData[squad.squadType];
        if (!typeDef) continue;
        const variantDef = typeDef[squad.variant];
        if (!variantDef?.TOE) continue;
        for (const [item, cratesPerSquad] of Object.entries(variantDef.TOE as Record<string, number>)) {
            totals.set(item, (totals.get(item) ?? 0) + cratesPerSquad * squad.count);
        }
    }
    return totals;
}

// Returns total soldiers configured in the battalion
export function countSoldiers(battalion: Battalion, toeData: any): number {
    let total = 0;
    for (const squad of battalion.squads) {
        const size: number = toeData[squad.squadType]?.size ?? 0;
        total += size * squad.count;
    }
    return total;
}

// Returns items that are below the depletion threshold (current < target * (1 - threshold))
export function getDepletedItems(
    toe: Map<string, number>,
    stockpileItems: Record<string, number>,
    threshold: number
): Map<string, { needed: number; current: number; target: number }> {
    const depleted = new Map<string, { needed: number; current: number; target: number }>();
    for (const [item, target] of toe.entries()) {
        const current = stockpileItems?.[item] ?? 0;
        if (current < target * (1 - threshold)) {
            depleted.set(item, { needed: Math.ceil(target - current), current, target });
        }
    }
    return depleted;
}

// Overall depletion percent (worst single item, 0–100)
export function overallDepletion(
    toe: Map<string, number>,
    stockpileItems: Record<string, number>
): number {
    let worst = 0;
    for (const [item, target] of toe.entries()) {
        if (target === 0) continue;
        const current = stockpileItems?.[item] ?? 0;
        const depletedPct = Math.max(0, (target - current) / target) * 100;
        if (depletedPct > worst) worst = depletedPct;
    }
    return Math.round(worst);
}

// ─── Freight helpers ──────────────────────────────────────────────────────────

// Resolve freight per crate for an item. Falls back to 1 if not found.
export function freightPerCrate(itemName: string): number {
    const prodMap: Map<string, any> = getProductionData();
    const entry = prodMap.get(itemName.toLowerCase());
    return entry?.freight ?? 1;
}

// ─── Manifest (freight) splitting ─────────────────────────────────────────────

export interface ManifestSlice {
    items: Map<string, number>; // item → crates in this manifest
    totalFreight: number;
}

/**
 * Greedy-fill bin packing: each manifest is filled to maxFreight before
 * starting the next. Items are processed in order; individual crates of a
 * single item may be split across manifests if needed.
 */
export function splitIntoManifests(
    depletedItems: Map<string, { needed: number; current: number; target: number }>,
    maxFreight: number
): ManifestSlice[] {
    const manifests: ManifestSlice[] = [];
    let current: ManifestSlice = { items: new Map(), totalFreight: 0 };

    for (const [item, { needed }] of depletedItems.entries()) {
        const fpC = freightPerCrate(item); // freight per crate (usually 1)
        let remaining = needed;

        while (remaining > 0) {
            const spaceLeft = maxFreight - current.totalFreight;
            if (spaceLeft <= 0 || Math.floor(spaceLeft / fpC) === 0) {
                // Current manifest is full — push and start a new one
                if (current.items.size > 0) manifests.push(current);
                current = { items: new Map(), totalFreight: 0 };
                continue;
            }
            const cratesThisRound = Math.min(remaining, Math.floor(spaceLeft / fpC));
            current.items.set(item, (current.items.get(item) ?? 0) + cratesThisRound);
            current.totalFreight += cratesThisRound * fpC;
            remaining -= cratesThisRound;
        }
    }

    if (current.items.size > 0) manifests.push(current);
    return manifests;
}

// ─── Tech gate check ──────────────────────────────────────────────────────────

export async function isVehicleAvailable(vehicleKey: string): Promise<boolean> {
    const vehicles = getVehiclesData();
    const v = vehicles[vehicleKey];
    if (!v) return false;
    if (!v.techRequired) return true;

    const collections = getCollections();
    const config = await collections.config.findOne({});
    const unlockedItems: string[] = config?.unlockedItems ?? [];
    const vic_tech: any = NodeCacheObj.get('vic_tech') ?? {};
    const inf_tech: any = NodeCacheObj.get('inf_tech') ?? {};
    const techItems: string[] = vic_tech[v.techRequired] ?? inf_tech[v.techRequired] ?? [];
    if (techItems.length > 0) {
        return techItems.some((item: string) => unlockedItems.includes(item));
    }
    return unlockedItems.includes(v.techRequired);
}

// ─── Manifest creation ────────────────────────────────────────────────────────

/**
 * Creates one Discord ticket channel per manifest (vehicle load).
 * Returns array of ticketIds for all created manifests.
 */
export async function createBattalionManifests(
    client: Client,
    guildId: string,
    battalionName: string,
    location: string,
    depletedItems: Map<string, { needed: number; current: number; target: number }>,
    vehicleKey: string = 'truck'
): Promise<string[]> {
    if (depletedItems.size === 0) return [];

    const vehicles = getVehiclesData();
    const vehicle = vehicles[vehicleKey];
    if (!vehicle) return [];

    const maxFreight: number = vehicle.freight;
    const vehicleLabel: string = vehicle.label;

    const slices = splitIntoManifests(depletedItems, maxFreight);
    if (slices.length === 0) return [];

    const collections = getCollections();
    const config = await collections.config.findOne({});
    if (!config) return [];

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return [];

    // Find or create "Oracle Logi Tickets" category
    let cat = guild.channels.cache.find(
        (v) => v.type === ChannelType.GuildCategory && v.name === 'Oracle Logi Tickets'
    );
    if (!cat) {
        cat = await guild.channels.create({
            name: 'Oracle Logi Tickets',
            type: ChannelType.GuildCategory,
        });
    }

    const createdTicketIds: string[] = [];
    const availableChannelId = config.availableTicketChannel || config.logisticsTicketChannel;

    for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        const manifestNum = i + 1;
        const title = `Manifest #${manifestNum} — ${battalionName} (${vehicleLabel})`;

        // Unique ticket ID
        let ticketId = crypto.randomBytes(2).toString('hex');
        while (await collections.tickets.findOne({ ticketId })) {
            ticketId = crypto.randomBytes(2).toString('hex');
        }

        // Create ticket role
        const rl = await guild.roles.create({ name: 'logi-support-' + ticketId }).catch(() => null);
        if (!rl) continue;

        const prm: any[] = [
            { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
            { id: rl.id, allow: ['ViewChannel'] },
            {
                id: config.botId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
        ];

        const chnl = await guild.channels
            .create({
                name: '📋' + title,
                type: ChannelType.GuildText,
                parent: cat.id,
                permissionOverwrites: prm,
            })
            .catch(() => null);
        if (!chnl) continue;

        const logisticsTypes = Array.from(slice.items.keys());
        const demanded = logisticsTypes.map((k) => slice.items.get(k)!);
        const delivered = logisticsTypes.map(() => 0);

        const channelEmbed = createOracleEmbed(
            `📋 ${title}`,
            `**Location:** ${location}\n**Load:** ${slice.totalFreight} / ${maxFreight} freight (${vehicleLabel})\n**Manifest ${manifestNum} of ${slices.length}**\n\nDeliver the items below and run **/deliver** to mark your contribution. This channel locks when all items are delivered.`,
            logisticsTypes.map((v, idx) => ({
                name: v,
                value: `${delivered[idx]} / ${demanded[idx]} crates`,
            })),
            ''
        );

        const msg = await (chnl as any).send({ embeds: [channelEmbed] }).catch(() => null);
        if (!msg) continue;

        const tckt = {
            channelId: chnl.id,
            ticketRoleId: rl.id,
            data: [],
            guildId,
            ticketId,
            author: 'battalion-system',
            delivered,
            location,
            transcript: [],
            notes: `Manifest ${manifestNum}/${slices.length} — Battalion: ${battalionName} | ${vehicleLabel} (${maxFreight} freight max)`,
            complete: true,
            updateEmbed: msg.id,
            closed: false,
            logisticsTypes,
            newUserTicket: false,
            demanded,
            ticketPostChannel: '',
            ticketPostEmbed: '',
            thread: '',
            threadMessageHeader: '',
            title,
        };

        const tcktRes = await collections.tickets.insertOne(tckt);
        await collections.config.updateOne({}, { $push: { tickets: tcktRes.insertedId } });

        // Post to available ticket channel
        if (availableChannelId) {
            const ticketChannel = await client.channels.fetch(availableChannelId).catch(() => null);
            if (ticketChannel) {
                const logiEmbed = createOracleEmbed(
                    `📋 ${title}`,
                    `**Battalion ${battalionName}** needs resupply.\n**Load:** ${slice.totalFreight} / ${maxFreight} freight | Manifest ${manifestNum} of ${slices.length}\n\nJoin this manifest and deliver the items listed below.`,
                    logisticsTypes.map((v, idx) => ({ name: v, value: `${demanded[idx]} crates` })),
                    ''
                );

                try {
                    const thread = await (ticketChannel as any).threads.create({
                        name: title,
                        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                        reason: 'Battalion manifest',
                        message: `Battalion: ${battalionName} | Location: ${location} | Manifest ${manifestNum}/${slices.length}`,
                    });

                    const threadMsg = await thread.send({
                        embeds: [logiEmbed],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 1,
                                        label: 'Join Manifest',
                                        custom_id: 'join_logi_ticket_' + ticketId,
                                    },
                                ],
                            },
                        ],
                    });

                    await collections.tickets.updateOne(
                        { _id: tcktRes.insertedId },
                        {
                            $set: {
                                thread: thread.id,
                                ticketPostEmbed: threadMsg.id,
                                ticketPostChannel: availableChannelId,
                            },
                        }
                    );
                } catch {
                    // Thread creation failed — not fatal
                }
            }
        }

        createdTicketIds.push(ticketId);
    }

    return createdTicketIds;
}
