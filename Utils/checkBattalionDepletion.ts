import { Client } from 'discord.js';
import { getCollections } from '../mongoDB';
import {
    getToeData,
    calculateBattalionTOE,
    getDepletedItems,
    createBattalionManifests,
} from './battalionUtils';

const checkBattalionDepletion = async (client: Client): Promise<void> => {
    const collections = getCollections();
    const toeData = getToeData();

    let battalions: any[];
    try {
        battalions = await collections.battalions.find({}).toArray();
    } catch {
        return;
    }

    for (const battalion of battalions) {
        const openIds: string[] = battalion.openManifestIds ?? [];

        // If there are open manifests, check if they're all closed before creating new ones
        if (openIds.length > 0) {
            let anyOpen = false;
            for (const id of openIds) {
                const ticket = await collections.tickets.findOne({ ticketId: id });
                if (ticket && !ticket.closed) { anyOpen = true; break; }
            }
            if (anyOpen) continue; // Still have active manifests — skip

            // All closed: clear the list so we can create new ones if needed
            await collections.battalions.updateOne(
                { _id: battalion._id },
                { $unset: { openManifestIds: '' } }
            );
            battalion.openManifestIds = undefined;
        }

        // Fetch linked stockpile
        const stockpile = await collections.stockpiles.findOne({ name: battalion.stockpileName });
        if (!stockpile) continue;

        const toe = calculateBattalionTOE(battalion, toeData);
        if (toe.size === 0) continue;

        const stockpileItems: Record<string, number> = (stockpile.items as any) ?? {};
        const depleted = getDepletedItems(toe, stockpileItems, battalion.depletionThreshold);
        if (depleted.size === 0) continue;

        // Auto-create manifests using trucks (default conservative vehicle)
        const ticketIds = await createBattalionManifests(
            client,
            battalion.guildId,
            battalion.name,
            battalion.stockpileName,
            depleted,
            'truck'
        );

        if (ticketIds.length > 0) {
            await collections.battalions.updateOne(
                { _id: battalion._id },
                { $set: { openManifestIds: ticketIds } }
            );
        }
    }
};

export default checkBattalionDepletion;
