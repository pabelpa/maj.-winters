import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import createOracleEmbed from '../Utils/createOracleEmbed';
import { get } from 'http';
const lbRemove = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let t = await getCollections().tickets.findOne({
        author: interaction.user.username,
        complete: false
    })

    if (!t || !t.logisticsTypes || !interaction.options.getString("resource")){
        interaction.editReply({content: "*No logistics request started, run **/create-logistics-ticket** to start builder*"})
        return false
    }

    if (t.logisticsTypes.find((v) => {
        return (interaction.options.getString("resource") as string).toLowerCase() == v.toLowerCase();
    })){
        let w = t.demanded;

        if (!w) return false;

        const o = t.logisticsTypes.findIndex((v) => {
            return (interaction.options.getString("resource") as string).toLowerCase() == v.toLowerCase();
        });

        if (interaction.options.getInteger("amount")){
            w[o] -= interaction.options.getInteger("amount") || 0;

            w[o] = Math.max(0, w[t.logisticsTypes.findIndex((v) => {
                return (interaction.options.getString("resource") as string).toLowerCase() == v.toLowerCase();
            })]);
        }else{
            w[o] = 0;
        }

        if (w[o] == 0){
            let m = t.logisticsTypes;
            let r = t.delivered;

            w = w.filter((v, i) => {
                return i != o;
            })

            m = m.filter((v, i) => {
                return i != o;
            })

            if (r){
                r = r.filter((v, i) => {
                    return i != o;
                })
            }
            await getCollections().tickets.updateOne(
            {
                author: interaction.user.username,
                complete: false
            },
                {
                $set:{
                    logisticsTypes: m,
                    delivered: r
            }
            })
        }
        await getCollections().tickets.updateOne(
            {
                author: interaction.user.username,
                complete: false
            },
                {
                $set:{
                    demanded: w
                }
            })

        t = await getCollections().tickets.findOne({
            author: interaction.user.username,
            complete: false
        })

        if (!t) return false;

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

    }else{
        interaction.editReply({content: "*Resource not found within ticket, did you spell it correctly?*"});
        return false;
    }
    return true
}
export default lbRemove