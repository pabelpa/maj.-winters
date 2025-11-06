import { StringSelectMenuInteraction, ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

const buildFacModal = (locationCode: string) => {
    const modal = new ModalBuilder()
        .setCustomId(`fac_setup_modal|loc=${locationCode}`)
        .setTitle('Create New FAC');

    const customNameInput = new TextInputBuilder()
        .setCustomId('customName')
        .setLabel('Custom FAC Name (optional)')
        .setPlaceholder('e.g., Steel Production Facility')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const msuppConsumptionInput = new TextInputBuilder()
        .setCustomId('msuppConsumption')
        .setLabel('MSUPP Consumption (per zone/tunnel)')
        .setPlaceholder('Format: 324/hr west tunnel, 15012 stock\n200/hr east tunnel, 8000 stock')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const exportsInput = new TextInputBuilder()
        .setCustomId('exports')
        .setLabel('Exports (items produced/sent out)')
        .setPlaceholder("steel, pcons, AM1-AM5, BT's, petrol")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const importsInput = new TextInputBuilder()
        .setCustomId('imports')
        .setLabel('Imports (items needed/brought in)')
        .setPlaceholder('coke, sulphur, HE powder')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(customNameInput);
    const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(msuppConsumptionInput);
    const row3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(exportsInput);
    const row4 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(importsInput);

    modal.addComponents(row1, row2, row3, row4);

    return modal;
};

const facSelectHandler = async (interaction: StringSelectMenuInteraction) => {
    if (interaction.customId !== 'fac_select_location') return false;

    const selected = interaction.values[0];
    const modal = buildFacModal(selected);
    await interaction.showModal(modal);
    return true;
};

export default facSelectHandler;
