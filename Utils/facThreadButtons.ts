import { ButtonInteraction, ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { getCollections } from "../mongoDB";

const buildEditStockModal = async (threadId: string) => {
    const collections = getCollections();
    const fac = await collections.facs.findOne({ threadId });

    const modal = new ModalBuilder()
        .setCustomId('fac_edit_stock_modal')
        .setTitle('Update Stock and Expiry');

    // Prefill with current stock lines if available
    const stocksPrefill = (fac?.msuppConsumption || [])
        .map(z => `${(z as any).hourlyRate ?? 0}/hr ${z.zoneName}, ${(z as any).currentStock ?? 0} stock`)
        .join('\n');

    const stockInput = new TextInputBuilder()
        .setCustomId('stocks')
    .setLabel('Stock per zone (rate required)')
    .setPlaceholder('Each line must include rate and stock. Example: 324/hr west tunnel, 15012 stock')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(stocksPrefill);

    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(stockInput);
    modal.addComponents(row);
    return modal;
};

const buildEditMetaModal = async (threadId: string) => {
    const collections = getCollections();
    const fac = await collections.facs.findOne({ threadId });

    const modal = new ModalBuilder()
        .setCustomId('fac_edit_meta_modal')
        .setTitle('Edit Imports/Exports/Rates/Notes');

    const exportsInput = new TextInputBuilder()
        .setCustomId('exports')
        .setLabel('Exports')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue((fac?.exports || []).join(', '));

    const importsInput = new TextInputBuilder()
        .setCustomId('imports')
        .setLabel('Imports')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue((fac?.imports || []).join(', '));

    // Prefill rates
    const ratesPrefill = (fac?.msuppConsumption || [])
        .map(z => `${z.hourlyRate}/hr ${z.zoneName}`)
        .join('\n');
    const ratesInput = new TextInputBuilder()
        .setCustomId('rates')
        .setLabel('Hourly rates per zone')
        .setPlaceholder('Example: 324/hr west tunnel')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(ratesPrefill);

    const proceduresInput = new TextInputBuilder()
        .setCustomId('procedures')
        .setLabel('Production Procedures (notes)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(fac?.procedures || '');

    const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(exportsInput);
    const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(importsInput);
    const row3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(ratesInput);
    const row4 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(proceduresInput);

    modal.addComponents(row1, row2, row3, row4);
    return modal;
};

const facThreadButtons = async (interaction: ButtonInteraction) => {
    if (interaction.customId === 'fac_edit_stock') {
        const modal = await buildEditStockModal(interaction.channelId);
        await interaction.showModal(modal);
        return true;
    }
    if (interaction.customId === 'fac_edit_meta') {
        const modal = await buildEditMetaModal(interaction.channelId);
        await interaction.showModal(modal);
        return true;
    }
    return false;
};

export default facThreadButtons;
