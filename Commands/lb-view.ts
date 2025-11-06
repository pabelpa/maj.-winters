    
import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import createOracleEmbed from '../Utils/createOracleEmbed';
const lbView = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let Ticket = getCollections().tickets
    const t = await Ticket.findOne({
        author: interaction.user.username,
        complete: false
    })

    if (!t){
        interaction.editReply({content: "*No logistics request started, run **/create-logistics-ticket** to start builder*"})
        return false
    }

    const logiChannelEmbed = createOracleEmbed('Logistics Ticket (' + t.location + ")" , "To add resources to the ticket run /lb-add\n\nTo remove resources from the ticket run /lb-remove\n\nIf you're done adding resource requirements, run /lb-complete.", 
        t.logisticsTypes?.map((v, i) => {
            if (!t.demanded) return {name: "A", value: "A"};
            return {name: v.toString(), value: t.demanded[i].toString()}
        }) as {value: string, name: string}[] , "");

        interaction.editReply({embeds: [logiChannelEmbed], components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: "Cancel Logi Request Builder",
                        custom_id: "cancel_logi_ticket_" + t.ticketId
                    }
                ]
            }
        ]});
    return true;
}

export default lbView