import { ModalSubmitInteraction, ChannelType, ThreadAutoArchiveDuration, ForumChannel, ActionRowBuilder, ModalActionRowComponentBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getCollections } from "../mongoDB";
import NodeCache from "node-cache";

declare global {
    var NodeCacheObj: NodeCache;
}

/**
 * Parse MSUPP consumption text into structured data
 * Expected format: "324/hr west tunnel, 15012 stock" or "200/hr east tunnel, 8000 stock"
 * Returns array of zone objects with name, hourlyRate, currentStock, and calculated expireDate
 */
const parseMsuppConsumption = (text: string): Array<{
    zoneName: string;
    hourlyRate: number;
    currentStock: number;
    expireDate?: Date;
}> => {
    const zones: Array<{
        zoneName: string;
        hourlyRate: number;
        currentStock: number;
        expireDate?: Date;
    }> = [];
    
    // Split by newlines or semicolons
    const lines = text.split(/\n|;/).map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
        // Match patterns like: "324/hr west tunnel, 15012 stock"
        const rateMatch = line.match(/(\d+)\s*\/\s*hr/i);
        const stockMatch = line.match(/(\d+)\s*stock/i);
        
        // Extract zone name (everything after the rate and before the stock, or vice versa)
        let zoneName = line;
        if (rateMatch) {
            zoneName = zoneName.replace(rateMatch[0], '');
        }
        if (stockMatch) {
            zoneName = zoneName.replace(stockMatch[0], '');
        }
        // Clean up zone name (remove commas, extra whitespace)
        zoneName = zoneName.replace(/,/g, '').trim();
        if (!zoneName) zoneName = 'Unknown Zone';
        
        const hourlyRate = rateMatch ? parseInt(rateMatch[1], 10) : 0;
        const currentStock = stockMatch ? parseInt(stockMatch[1], 10) : 0;
        
        // Calculate expiry date if both rate and stock are available
        let expireDate: Date | undefined = undefined;
        if (hourlyRate > 0 && currentStock > 0) {
            const hoursRemaining = currentStock / hourlyRate;
            expireDate = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
        }
        
        zones.push({
            zoneName,
            hourlyRate,
            currentStock,
            expireDate
        });
    }
    
    return zones;
};

/**
 * Format MSUPP consumption data for display in thread message
 */
const formatMsuppConsumption = (zones: Array<{
    zoneName: string;
    hourlyRate: number;
    currentStock: number;
    expireDate?: Date;
}>): string => {
    if (!zones || zones.length === 0) return '*No MSUPP consumption data provided*';
    
    let output = '';
    for (const zone of zones) {
        output += `**${zone.zoneName}**\n`;
        output += `├ Rate: ${zone.hourlyRate}/hr\n`;
        output += `├ Stock: ${zone.currentStock}\n`;
        if (zone.expireDate) {
            const timestamp = Math.floor(zone.expireDate.getTime() / 1000);
            const hoursLeft = Math.round((zone.expireDate.getTime() - Date.now()) / (1000 * 60 * 60));
            output += `└ Expires: <t:${timestamp}:R> (${hoursLeft}hrs)\n`;
        } else {
            output += `└ Expires: *Unknown*\n`;
        }
        output += '\n';
    }
    
    return output;
};

/**
 * Handle FAC setup modal submission
 */
const facModalHandler = async (interaction: ModalSubmitInteraction) => {
    // Handle location selection modal first
    if (interaction.customId === 'fac_location_modal') {
        const locationRaw = interaction.fields.getTextInputValue('location');
        const locationMappings = global.NodeCacheObj.get("locationMappings") as Record<string, string>;
        const cleanedInput = locationRaw.replace(/\./g, "").replace(/\$/g, "").toLowerCase();
        
        // Try to find matching location code (either direct code match or search in names)
        let matchedCode: string | undefined = undefined;
        
        // First, check if input is a direct code match
        if (cleanedInput in locationMappings) {
            matchedCode = cleanedInput;
        } else {
            // Search for input in location names
            for (const code in locationMappings) {
                if (locationMappings[code].toLowerCase().includes(cleanedInput)) {
                    matchedCode = code;
                    break; // Use first match
                }
            }
        }
        
        if (!matchedCode) {
            await interaction.reply({ 
                content: `❌ No location found matching \`${locationRaw}\`. Please try again with a valid location name or code.`,
                ephemeral: true
            });
            return;
        }
        
        const locationName = locationMappings[matchedCode];
        
        // Location is valid, send a button that will open the main FAC modal
        const continueButton = new ButtonBuilder()
            .setCustomId(`fac_continue|${matchedCode}`)
            .setLabel('Continue to FAC Details')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<any>().addComponents(continueButton);

        await interaction.reply({
            content: `✅ Location: **${locationName}** (${matchedCode})\n\nClick the button below to continue and fill in FAC details.`,
            components: [row],
            ephemeral: true
        });
        return;
    }
    
    // Handle stock update modal (supports adding new zones and optional rate updates)
    if (interaction.customId === 'fac_edit_stock_modal') {
        await interaction.deferReply({ ephemeral: true });
        try {
            const stocksRaw = interaction.fields.getTextInputValue('stocks') || '';
            const collections = getCollections();
            const threadId = interaction.channelId || '';
            const fac = await collections.facs.findOne({ threadId });
            if (!fac) {
                await interaction.editReply({ content: '❌ FAC record not found for this thread.' });
                return;
            }

            const zones = (fac.msuppConsumption || []).map((z: any) => ({...z}));
            const lines = stocksRaw.split(/\n|;/).map(l => l.trim()).filter(Boolean);
            let missingRate = false;
            for (const line of lines) {
                const rateMatch = line.match(/(\d+)\s*\/\s*hr/i);
                const stockMatch = line.match(/(\d+)\s*stock/i);
                if (!rateMatch) { missingRate = true; continue; }
                const number = stockMatch ? parseInt(stockMatch[1], 10) : undefined;
                const rateFromLine = rateMatch ? parseInt(rateMatch[1], 10) : undefined;
                let name = line;
                if (rateMatch) name = name.replace(rateMatch[0], '');
                if (stockMatch) name = name.replace(stockMatch[0], '');
                name = name.replace(/,/g,'').trim();
                const nameKey = name.toLowerCase();
                if (!number || !nameKey) continue;

                const idx = zones.findIndex(z => z.zoneName.toLowerCase() === nameKey);
                if (idx >= 0) {
                    zones[idx].zoneName = zones[idx].zoneName || name; // keep original casing if present
                    zones[idx].currentStock = number;
                    zones[idx].hourlyRate = typeof rateFromLine === 'number' ? rateFromLine : (zones[idx].hourlyRate || 0);
                    const rate = zones[idx].hourlyRate || 0;
                    zones[idx].expireDate = rate > 0 ? new Date(Date.now() + (number/rate)*3600000) : undefined;
                } else {
                    // Create a new zone when it doesn't exist yet (rate required)
                    const hourlyRate = typeof rateFromLine === 'number' ? rateFromLine : 0;
                    const expireDate = hourlyRate > 0 ? new Date(Date.now() + (number/hourlyRate)*3600000) : undefined;
                    zones.push({
                        zoneName: name,
                        hourlyRate,
                        currentStock: number,
                        expireDate
                    });
                }
            }

            if (missingRate) {
                await interaction.editReply({ content: '❌ Every line must include a rate (e.g., "324/hr"). Stock-only updates are not allowed.' });
                return;
            }

            await collections.facs.updateOne({ threadId }, { $set: { msuppConsumption: zones } });

            // Refresh starter message
            const thread = await interaction.channel?.fetch();
            const fetchedThread = await interaction.guild?.channels.fetch(threadId);
            if (fetchedThread && fetchedThread.isThread()) {
                const starter = await (fetchedThread as any).fetchStarterMessage();
                const locationMappings = global.NodeCacheObj.get("locationMappings") as Record<string,string>;
                const locationName = locationMappings[fac.location] || fac.location;
                let content = `# ${locationName} FAC`;
                if (fac.customName) content += ` - ${fac.customName}`;
                content += `\n\n## 📊 MSUPP Consumption\n` + formatMsuppConsumption(zones);
                content += `## 📤 Exports\n` + ((fac.exports||[]).map((i:string)=>`• ${i}`).join('\n') || '*No exports specified*') + '\n\n';
                content += `## 📥 Imports\n` + ((fac.imports||[]).map((i:string)=>`• ${i}`).join('\n') || '*No imports specified*') + '\n\n';
                content += '## 📋 Production Procedures\n' + (fac.procedures || '*No procedures specified*') + '\n\n';
                // Footer with last updater
                content += `---\n*Updated by ${interaction.user} • Use \`/fac-close\` to close this FAC*`;
                await (starter as any).edit({ content, components: [{ type:1, components:[{type:2,style:1,label:'Update Stock/Expiry',custom_id:'fac_edit_stock'},{type:2,style:1,label:'Edit Imports/Exports/Rates/Notes',custom_id:'fac_edit_meta'}]}]});
            }

            await interaction.editReply({ content: '✅ Stock and expiry updated.' });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: '❌ Failed to update stock.' });
        }
        return;
    }

    // Handle meta edit modal
    if (interaction.customId === 'fac_edit_meta_modal') {
        await interaction.deferReply({ ephemeral: true });
        try {
            const exportsRaw = interaction.fields.getTextInputValue('exports') || '';
            const importsRaw = interaction.fields.getTextInputValue('imports') || '';
            const ratesRaw = interaction.fields.getTextInputValue('rates') || '';
            const proceduresRaw = interaction.fields.getTextInputValue('procedures') || '';
            const threadId = interaction.channelId || '';
            const collections = getCollections();
            const fac = await collections.facs.findOne({ threadId });
            if (!fac) {
                await interaction.editReply({ content: '❌ FAC record not found for this thread.' });
                return;
            }

            const exportsArr = exportsRaw.split(/,|\n/).map(s=>s.trim()).filter(Boolean);
            const importsArr = importsRaw.split(/,|\n/).map(s=>s.trim()).filter(Boolean);
            // Update rates by matching zone names
            const zones = (fac.msuppConsumption || []).map((z:any)=>({...z}));
            const rateLines = ratesRaw.split(/\n|;/).map(l=>l.trim()).filter(Boolean);
            for (const line of rateLines) {
                const rateMatch = line.match(/(\d+)\s*\/\s*hr/i);
                const rate = rateMatch ? parseInt(rateMatch[1],10) : undefined;
                const name = line.replace(rateMatch ? rateMatch[0] : '', '').replace(/,/g,'').trim().toLowerCase();
                if (!rate || !name) continue;
                const idx = zones.findIndex(z=>z.zoneName.toLowerCase()===name);
                if (idx>=0) {
                    zones[idx].hourlyRate = rate;
                    const stock = zones[idx].currentStock || 0;
                    zones[idx].expireDate = rate>0 && stock>0 ? new Date(Date.now() + (stock/rate)*3600000) : undefined;
                }
            }

            await collections.facs.updateOne({ threadId }, { $set: { exports: exportsArr.length?exportsArr:undefined, imports: importsArr.length?importsArr:undefined, msuppConsumption: zones, procedures: proceduresRaw || undefined } });

            // Refresh starter message
            const fetchedThread = await interaction.guild?.channels.fetch(threadId);
            if (fetchedThread && fetchedThread.isThread()) {
                const starter = await (fetchedThread as any).fetchStarterMessage();
                const locationMappings = global.NodeCacheObj.get("locationMappings") as Record<string,string>;
                const locationName = locationMappings[fac.location] || fac.location;
                let content = `# ${locationName} FAC`;
                if (fac.customName) content += ` - ${fac.customName}`;
                content += `\n\n## 📊 MSUPP Consumption\n` + formatMsuppConsumption(zones);
                content += `## 📤 Exports\n` + (exportsArr.length? exportsArr.map(i=>`• ${i}`).join('\n') : '*No exports specified*') + '\n\n';
                content += `## 📥 Imports\n` + (importsArr.length? importsArr.map(i=>`• ${i}`).join('\n') : '*No imports specified*') + '\n\n';
                content += '## 📋 Production Procedures\n' + (proceduresRaw || '*No procedures specified*') + '\n\n';
                // Footer with last updater
                content += `---\n*Updated by ${interaction.user} • Use \`/fac-close\` to close this FAC*`;
                await (starter as any).edit({ content, components: [{ type:1, components:[{type:2,style:1,label:'Update Stock/Expiry',custom_id:'fac_edit_stock'},{type:2,style:1,label:'Edit Imports/Exports/Rates/Notes',custom_id:'fac_edit_meta'}]}]});
            }

            await interaction.editReply({ content: '✅ Metadata updated.' });
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: '❌ Failed to update metadata.' });
        }
        return;
    }

    // Handle the main FAC setup modal
    if (!interaction.customId.startsWith('fac_setup_modal')) return;
    
    // Defer reply (ephemeral) to give us time to process
    await interaction.deferReply({ ephemeral: true });
    
    try {
        // Extract location from customId if provided (format: fac_setup_modal|loc=CODE)
        let cleanedLocationFromId: string | undefined = undefined;
        const parts = interaction.customId.split('|');
        if (parts.length > 1) {
            const locPart = parts.find(p => p.startsWith('loc='));
            if (locPart) cleanedLocationFromId = locPart.split('=')[1];
        }

        // Extract field values from modal
        const locationRaw = cleanedLocationFromId ? cleanedLocationFromId : (interaction.fields.getTextInputValue('location') || '');
        const customName = interaction.fields.getTextInputValue('customName') || '';
        const msuppConsumptionRaw = interaction.fields.getTextInputValue('msuppConsumption') || '';
        const exportsRaw = interaction.fields.getTextInputValue('exports') || '';
        const importsRaw = interaction.fields.getTextInputValue('imports') || '';
        const proceduresRaw = interaction.fields.getTextInputValue('procedures') || '';
            
        // Validate location (use same cleaning as /fac-create and /spaddloc)
        const locationMappings = global.NodeCacheObj.get("locationMappings") as Record<string, string>;
        const cleanedLocation = (cleanedLocationFromId ? cleanedLocationFromId : locationRaw).replace(/\./g, "").replace(/\$/g, "").toLowerCase();
        
        if (!(cleanedLocation in locationMappings)) {
            await interaction.editReply({ 
                content: `❌ The location code \`${cleanedLocation}\` does not exist. Please try again with a valid location code.` 
            });
            return;
        }
        
        const locationName = locationMappings[cleanedLocation];
        
        // Parse MSUPP consumption into structured data
        const msuppConsumption = msuppConsumptionRaw ? parseMsuppConsumption(msuppConsumptionRaw) : [];
        
        // Parse exports and imports (split by comma or newline)
        const exports = exportsRaw
            .split(/,|\n/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        const imports = importsRaw
            .split(/,|\n/)
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        // Get guild config to find forum channel
        const collections = getCollections();
        const config = await getCollections().config.findOne({});
        // ensure interaction happened in the configured management post/thread or channel
        if (!config || (config.facMessageId ? interaction.channelId !== config.facMessageId : interaction.channelId !== config.facChannel)) {
            await interaction.followUp({ content: "This button can only be used in the designated FAC management channel/post.", ephemeral: true });
            return;
        }
        
        const forumChannelId = config.facChannel;
        const fetchedForum = await interaction.guild?.channels.fetch(forumChannelId).catch(() => null);
        if (!fetchedForum || (fetchedForum.type !== ChannelType.GuildForum)) {
            await interaction.followUp({ content: "Configured FAC channel is not a forum. Please reconfigure the FAC channel.", ephemeral: true });
            return;
        }
        
        const forum = fetchedForum as ForumChannel;
        
        // Create thread name
        let threadName = `${locationName} FAC`;
        if (customName) threadName += ` - ${customName}`;
        
        // Format the thread message content
        let messageContent = `# ${locationName} FAC`;
        if (customName) messageContent += ` - ${customName}`;
        messageContent += '\n\n';
        
        // MSUPP Consumption section
        messageContent += '## 📊 MSUPP Consumption\n';
        messageContent += formatMsuppConsumption(msuppConsumption);
        
        // Exports section
        messageContent += '## 📤 Exports\n';
        if (exports.length > 0) {
            messageContent += exports.map(item => `• ${item}`).join('\n');
        } else {
            messageContent += '*No exports specified*';
        }
        messageContent += '\n\n';
        
        // Imports section
        messageContent += '## 📥 Imports\n';
        if (imports.length > 0) {
            messageContent += imports.map(item => `• ${item}`).join('\n');
        } else {
            messageContent += '*No imports specified*';
        }
        messageContent += '\n\n';
        
        // Procedures section
        messageContent += '## 📋 Production Procedures\n';
        messageContent += proceduresRaw ? proceduresRaw : '*No procedures specified*';
        messageContent += '\n\n';
        
        // Footer
        messageContent += `---\n*Created by ${interaction.user} • Use \`/fac-close\` to close this FAC*`;
        
        // Create the forum thread (forum post)
        const thread = await forum.threads.create({
            name: threadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: `FAC Creation by ${interaction.user.tag}`,
            message: {
                content: messageContent,
                components: [{
                    type: 1,
                    components: [
                        { type: 2, style: 1, label: "Update Stock/Expiry", custom_id: "fac_edit_stock" },
                        { type: 2, style: 1, label: "Edit Imports/Exports/Rates/Notes", custom_id: "fac_edit_meta" }
                    ]
                }]
            }
        });
        
        if (!thread) {
            await interaction.editReply({ 
                content: "❌ Failed to create FAC thread. Please try again or contact pabelpanator." 
            });
            return;
        }
        
        // Add user to the thread
        await thread.members.add(interaction.user.id);
        
        // Insert FAC record into database
        await collections.facs.insertOne({
            guildId: interaction.guildId || '',
            threadId: thread.id,
            location: cleanedLocation,
            customName: customName || undefined,
            msuppConsumption: msuppConsumption.length > 0 ? msuppConsumption : undefined,
            exports: exports.length > 0 ? exports : undefined,
            imports: imports.length > 0 ? imports : undefined,
            procedures: proceduresRaw || undefined,
            createdBy: interaction.user.id,
            createdAt: new Date()
        });
        
        // Silent completion - no visible response
        await interaction.deleteReply();
        
    } catch (error) {
        console.error('Error in facModalHandler:', error);
        await interaction.editReply({ 
            content: "❌ An error occurred while creating the FAC. Please try again or contact pabelpanator." 
        });
    }
};

export default facModalHandler;
