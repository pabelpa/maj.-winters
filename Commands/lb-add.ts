import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, Collection } from 'discord.js';
import createOracleEmbed from '../Utils/createOracleEmbed';
const lbAdd = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let tickets = getCollections().tickets
    let t = await tickets.findOne({
        author: interaction.user.username,
        complete: false
    })

    if (!t || !t.logisticsTypes || !interaction.options.getString("resource")){
        interaction.editReply({content: "*No logistics request started, run **/create-logistics-ticket** to start builder*"})
        return false
    }

    if (t.logisticsTypes.find((v) => {
        return (interaction.options.getString("resource") as string).toLowerCase() == v.toLowerCase()
    })){
        let w = t.demanded;

        if (!w) return false;

        let resourceIndex = t.logisticsTypes.findIndex((v) => {
            return (interaction.options.getString("resource") as string).toLowerCase() == v.toLowerCase()
        })

        w[resourceIndex] += interaction.options.getInteger("amount") || 0;

        await tickets.updateOne({
            author: interaction.user.username,
            complete: false
        },{
            $set:{demanded: w}
        })
    }else{
        await tickets.updateOne({
            author: interaction.user.username,
            complete: false
        },{
            $push: {logisticsTypes : interaction.options.getString("resource")!, demanded : interaction.options.getInteger("amount")!, delivered : 0}
        })
    }

    t = await tickets.findOne({
        author: interaction.user.username,
        complete: false
    })

    if (!t){
        return false
    }

    const logiChannelEmbed = createOracleEmbed('Logistics Ticket (' + t.location + ")" , "To add resources to the ticket run /lb-add\n\nTo remove resources from the ticket run /lb-remove\n\nIf you're done adding resource requirements, run /lb-complete.", 
        t.logisticsTypes?.map((v, i) => {
            
            if (!t || !t.demanded) return {name: "A", value: "A"};
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
export default lbAdd