import { ButtonInteraction, ChannelType, ThreadAutoArchiveDuration,  ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ModalActionRowComponentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { getCollections } from "../mongoDB";
import NodeCache from "node-cache";

declare global {
    var NodeCacheObj: NodeCache;
}

const buttonHandlerFac = async (interaction: ButtonInteraction) => {
    if (interaction.customId === 'create_fac') {
        const config = await getCollections().config.findOne({});
        // ensure interaction happened in the configured management post/thread or channel
        if (!config || (config.facMessageId ? interaction.channelId !== config.facMessageId : interaction.channelId !== config.facChannel)) {
            await interaction.followUp({ content: "This button can only be used in the designated FAC management channel/post.", ephemeral: true });
            return;
        }

        // Fetch the forum channel where FAC threads should be created
        const forumChannelId = config.facChannel;
        const fetchedForum = await interaction.guild?.channels.fetch(forumChannelId).catch(() => null);
        if (!fetchedForum || (fetchedForum.type !== ChannelType.GuildForum)) {
            await interaction.followUp({ content: "Configured FAC channel is not a forum. Please reconfigure the FAC channel.", ephemeral: true });
            return;
        }
        const forum = fetchedForum as any; // cast to ForumChannel-like

        // Show a modal to get the location (using text input which we'll later handle with autocomplete-like validation)
        const searchModal = new ModalBuilder()
            .setCustomId('fac_location_modal')
            .setTitle('Select FAC Location');

        const locationInput = new TextInputBuilder()
            .setCustomId('location')
            .setLabel('Location Code or Name')
            .setPlaceholder('Start typing location name or code...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(locationInput);
        searchModal.addComponents(row);

        await interaction.showModal(searchModal);
    } else if (interaction.customId.startsWith('fac_continue|')) {
        const locationCode = interaction.customId.split('|')[1];
        
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

        const proceduresInput = new TextInputBuilder()
            .setCustomId('procedures')
            .setLabel('Production Procedures (notes)')
            .setPlaceholder('Describe how production is organized, scheduling, transport, etc.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const row1 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(customNameInput);
        const row2 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(msuppConsumptionInput);
        const row3 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(exportsInput);
        const row4 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(importsInput);
        const row5 = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(proceduresInput);

        modal.addComponents(row1, row2, row3, row4, row5);

        await interaction.showModal(modal);
    }
};

export default buttonHandlerFac;