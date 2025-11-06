import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction, GuildMemberRoleManager,ThreadAutoArchiveDuration } from 'discord.js';
import createOracleEmbed from '../Utils/createOracleEmbed';
import { get } from 'http';
const lbComplete = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    const t = await getCollections().tickets.findOne({
        author: interaction.user.username,
        complete: false
    })

    if (!t){
        interaction.editReply({
            content: "*No logistics request started, run **/create-logistics-ticket** to start builder*"
        })
        return false
    }

    await (interaction.member?.roles as GuildMemberRoleManager).add(t.ticketRoleId);

    const p = await interaction.client.channels.fetch(t.channelId)
    if (!p || !p.isTextBased()) {
        
        return false
    }

    const logiChannelEmbed = createOracleEmbed('Logistics Ticket (' + t.location + ")" , `${t.author} is requesting logistics assistance, help them out by joining this ticket and marking your deliveries. \n\nRequested resources listed below.`, 
        t.logisticsTypes?.map((v, i) => {
            
            if (!t.demanded) return {name: "A", value: "A"};
            return {name: v.toString(), value: t.demanded[i].toString()}
        }) as {value: string, name: string}[] , "");

        const ticketChannelEmbed = createOracleEmbed('Logistics Ticket (' + t.location + ")" , "Welcome to support ticket " + t.ticketId + ", help " + t.author  +" out by delivering the requested supplies and then running the **/deliver** command to report your work\n\nThe fields below are automatically updated as deliveries are reported\n\nThis channel will automatically lock when all requirements are fulfilled", 
        t.logisticsTypes?.map((v, i) => {
            if (!t.demanded || !t.delivered) return {name: "A", value: "A"};
            return {name: v.toString(), value: t.delivered[i].toString() + " / " + t.demanded[i].toString()}
        }) as {value: string, name: string}[] , "");

    
    await p.messages.fetch(t.updateEmbed).then(msg => (msg as any).edit({embeds: [ticketChannelEmbed], components: [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: "Force Resolve Ticket",
                    custom_id: "force_resolve_logi_ticket_" + t.ticketId
                }
            ]
        }
    ]}))

    await getCollections().tickets.updateOne(
        {
            _id:t._id
        },
            {
            $set:{complete: true}
        })
    
    let config = await getCollections().config.findOne({})
    if (!config) return false
    interaction.client.channels.fetch(config.availableTicketChannel || interaction.channelId).then(async (channel) => {
        if (!channel || !config) return;

        
        let thread = await (channel as any).threads.create({
            name: t.title,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            reason: "Ticket",
            message:`Created by: ${t.author} Location: ${t.location}`,
        });
        getCollections().tickets.updateOne({_id:t._id},{$set:{
            thread:thread.id,
            threadHeaderMessage:thread.lastMessageId
        }}) 
        const v = await thread.send({embeds: [logiChannelEmbed], components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: "Join Ticket",
                        custom_id: "join_logi_ticket_" + t.ticketId
                    }
                ]
            }
        ]});
        await getCollections().tickets.updateOne(
        {
            _id:t._id
        },
            {
            $set:{
                ticketPostEmbed: v.id,
                ticketPostChannel: config.availableTicketChannel || interaction.channelId
            }
        })
    })


    interaction.editReply({content: "Logistics ticket published to <#" + config.availableTicketChannel + "> and accessible in <#" + t.channelId + ">"})
    return true
}
export default lbComplete