import { Client, ChatInputCommandInteraction, GuildMember,GuildMemberRoleManager,ChannelType, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { getCollections } from '../mongoDB'
import createOracleEmbed from "../Utils/createOracleEmbed";

const createLogisticsTicket = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let collections = getCollections();
    let config = (await collections.config.findOne({}))!
    const activeRole = config.activeRole;
    const inactiveRole = config.inactiveRole;

    if (!activeRole) {
        interaction.editReply({content: '*Error: Active Role has not been configured*', });
        return false;
    }

    if (!inactiveRole) {
        interaction.editReply({content: '*Error: Inactive Role has not been configured*', });
        return false;
    }

    const r = await collections.tickets.deleteOne({
        author: interaction.user.username,
        complete: false
    })


    if (!(interaction.member?.roles as GuildMemberRoleManager).cache.some((v) => {return v.id == activeRole})){
        interaction.editReply({content: `*You must be enlisted to start a logistics ticket, enlist by running the **/enlist command***`});
        return false;
    }

    if (!interaction.guild) return false;

    let cat = interaction.guild.channels.cache.find((v) => {return v.type == ChannelType.GuildCategory && v.name == "Oracle Logi Tickets"});

    if (!cat){
        cat = await interaction.guild.channels.create({
            name: "Oracle Logi Tickets",
            type: ChannelType.GuildCategory,
            // your permission overwrites or other options here
        });

        if (!cat){
            interaction.editReply({content:"*Error: Unable to create Logi Ticket Category*"})
        }
    }

    let ticketId = Math.random().toString(36).slice(2, 6);

    while ((await collections.tickets.findOne({ticketId: ticketId}))){
        ticketId = Math.random().toString(36).slice(2, 6);
    }

    const rl = await interaction.guild.roles.create({
        name: "logi-support-" + ticketId
    });

    const perms = (interaction.guild.roles.cache.map((v) => {
        if (v.permissions.has("ManageRoles")){
            return {id: v.id, allow: ["ViewChannel"]}
        }

    }) as any[]).concat([{
        id: interaction.guild.roles.everyone.id, 
        deny: ["ViewChannel"]
    },
    {
        id: rl.id, 
        allow: ["ViewChannel"]
    }] as any[])

    let prm: any[] = [{
        id: interaction.guild.roles.everyone.id, 
        deny: ["ViewChannel"]
    },
    {
        id: rl.id, 
        allow: ["ViewChannel"]
    },
    {
        id:config.botId,
        allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
        ]
    }
    ]
    let chnl
    try {
        chnl = await interaction.guild.channels.create({
            name: "🎫"+interaction.options.getString('title') as string,
            type: ChannelType.GuildText,
            parent: cat.id,
            permissionOverwrites: prm
            // your permission overwrites or other options here
        });

    } catch{
        interaction.editReply("there was an issue creating the ticket channel, check to make sure the bot has the correct permissions")
        return false
    }
    
    // const ticketEmbed = createOracleEmbed('Logistics Ticket ' + (interaction.options.getString('logi-type')) +' (' + interaction.options.getString('sub-type') + ') - ' + interaction.options.getString('location'), " ", [], "");
    const ticketEmbed = createOracleEmbed('Logistics Ticket ' + interaction.options.getString('location'), " ", [], "");
    let msg
    try {
        msg = await chnl.send({embeds: [ticketEmbed]});
        
    } catch (error){
        console.log(error)
        interaction.editReply("there was an issue sending a message the ticket's channel, check to make sure the bot has the correct permissions")
        return false
        
    }
    const tckt = {
        channelId: chnl.id,
        ticketRoleId: rl.id,
        data: [],
        guildId: interaction.guildId as string,
        ticketId: ticketId,
        author: interaction.user.username,
        delivered: [],
        location: interaction.options.getString('location') as string,
        transcript: [],
        notes: interaction.options.getString('notes') as string,
        complete: false,
        updateEmbed: msg.id,
        closed: false,
        logisticsTypes:[],
        newUserTicket:false,
        demanded:[],
        ticketPostChannel:"",
        ticketPostEmbed:"",
        thread:"",
        threadMessageHeader:"",
        title:interaction.options.getString('title') as string
    }
    const tckt_res = await collections.tickets.insertOne(tckt);

    await collections.config.updateOne({},{
        $push: {tickets: tckt_res.insertedId}
    });

    interaction.client.channels.fetch(config.logisticsTicketChannel || interaction.channelId).then(async (channel) => {
        if (!channel) return;
        /*
        await (channel as any).send({embeds: [ticketEmbed], components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 1,
                        label: "Join Ticket",
                        custom_id: "join_logi_ticket_" + ticketId
                    }
                ]
            }
        ],});
        */


        const logiChannelEmbed = createOracleEmbed('Logistics Ticket (' + tckt.location + ")" , "To add resources to the ticket run /lb-add\n\nTo remove resources from the ticket run /lb-remove\n\nIf you're done adding resource requirements, run /lb-complete.", 
            tckt.logisticsTypes?.map((v:string, i:number) => {
            if (!tckt || !tckt.demanded) return {name: "A", value: "A"};
            return {name: v.toString(), value: (tckt.demanded[i] as number).toString()}
        }) as {value: string, name: string}[] , "");

        interaction.editReply({embeds: [logiChannelEmbed], components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        label: "Cancel Logi Request Builder",
                        custom_id: "cancel_logi_ticket_" + tckt.ticketId
                    }
                ]
            }
        ]});
    });  

    return true
}

export default createLogisticsTicket
            