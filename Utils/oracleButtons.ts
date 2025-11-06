import { ButtonInteraction,GuildMemberRoleManager,PermissionsBitField,ChannelType } from "discord.js";
import { getCollections } from "../mongoDB";
import createOracleEmbed from "./createOracleEmbed";
const buttonHandlerOracle = async (interaction: ButtonInteraction) => {
    let config = await getCollections().config.findOne({})
    let Ticket = getCollections().tickets
    if (interaction.customId.startsWith('join_logi_ticket_')){
        let ticketId = interaction.customId.substring(interaction.customId.length - 4, interaction.customId.length);

        const tckt = await Ticket.findOne({
            ticketId: ticketId
        });

        if (!tckt){
            interaction.reply({content: '*Error: Invalid Ticket ID*',ephemeral:true});
            return;
        }

        if (!interaction.member) return;

        (interaction.member.roles as GuildMemberRoleManager).add(tckt.ticketRoleId);

        const rplyEmbed = createOracleEmbed("Logistics Ticket Joined [" + tckt.ticketId + "]", "You have joined " + (tckt.author) + "'s logistics ticket at " + tckt.location + "\n\nRun the */deliver* command in <#" + tckt.channelId + "> to mark your contributions and use the channel to communicate with fellow soldiers.", tckt.logisticsTypes?.map((v, i) => {
            
            if (!tckt.demanded) return {name: "A", value: "A"};
            return {name: v.toString(), value: tckt.demanded[i].toString()}
        }) as {value: string, name: string}[], "");

        interaction.reply({embeds: [rplyEmbed],ephemeral:true});
    }else if (interaction.customId == 'enlist_btn' && config){
        const activeRole = config.activeRole;
        const inactiveRole = config.inactiveRole;

        if (!activeRole) {
            interaction.reply({content: '*Error: Active Role has not been configured*',ephemeral:true});
            return;
        }

        if (!inactiveRole) {
            interaction.reply({content: '*Error: Inactive Role has not been configured*',ephemeral:true});
            return;
        }

        if (!interaction.member) return;

        if ((interaction.member.roles as GuildMemberRoleManager).cache.some((v) => {return v.id == activeRole})){
            interaction.reply({content: `*You've already enlisted! Get out there and fight*`,ephemeral:true});
            return;
        }else{
            (interaction.member.roles as GuildMemberRoleManager).add(activeRole);
            interaction.reply({content: '*Successfully signed up for da war ',ephemeral:true});
            return;
        }
    }else if (interaction.customId.startsWith("cancel_logi_ticket_") && config){
        const t = await Ticket.findOne({
            author: interaction.user.username,
            ticketId: interaction.customId.substring(interaction.customId.length - 4, interaction.customId.length),
            complete: false
        })

        if (!t){
            interaction.reply({content: "*No logistics request started, run **/create-logistics-ticket** to start builder*",ephemeral:true})
            return
        }
        
        await Ticket.deleteOne({_id:t._id});
        const rle = await interaction.guild?.roles.fetch(t.ticketRoleId);
        const q = interaction.client.channels.cache.get(t.channelId);
        if (rle){
            await rle.delete();
        }
        
        if (q){
            await q.delete()
        }
        interaction.reply({content: "*Current builder discarded, start a new ticket by running the **/create-logistics-ticket** command*",ephemeral:true})
    }else if (interaction.customId.startsWith("force_resolve_logi_ticket_") && config){
        if ((interaction.member?.permissions as Readonly<PermissionsBitField>).has("ManageChannels")){
            const t = await Ticket.findOne({
                ticketId: interaction.customId.substring(interaction.customId.length - 4, interaction.customId.length)
            })

            if (!t){
                interaction.reply({content: "*Error finding ticket*",ephemeral:true})
                return
            }

            const q = interaction.client.channels.cache.get(t.channelId);

            if (q && q.type == ChannelType.GuildText){

                const logiChannelEmbed = createOracleEmbed('Logistics Ticket [COMPLETE] (' + t.location + ") - " + t.ticketId , "**Logistics order complete**, Logistics order has been marked resolved by officer (" + interaction.user.username + ")", 
                    t.logisticsTypes?.map((v, i) => {
                        if (!t || !t.demanded || !t.delivered) return {name: "A", value: "A"};
                        return {name: v.toString(), value: t.delivered[i].toString() + " / " + t.demanded[i].toString()}
                    }) as {value: string, name: string}[] , "");
            

                if (t.ticketPostEmbed && t.ticketPostChannel){
                    const p = await interaction.client.channels.fetch(t.ticketPostChannel);
                    if (!p || !p.isTextBased()) return;

                    await p.messages.fetch(t.ticketPostEmbed).then(async msg => {
                        if (!msg) return;

                        await (msg as any).edit({embeds: [logiChannelEmbed], components: []})
                    });    
                }
            
            }

            if (!interaction.guild) return;

            const users = await interaction.guild.members.list();

            const transcriptEmbed = createOracleEmbed('Logistics Ticket (' + t.ticketId + ") - Transcript" , "This ticket was recently closed, here's a transcript of the discussion:\n\n" + (t.transcript.length > 0 ? t.transcript.join("\n\n") : "*No messages were sent*"), 
                    [] , "");

            for (let i = 0; i < users.size; i++) {
                if (users.at(i)?.roles.cache.some((v) => {return v.id == t.ticketRoleId})) {
                    await users.at(i)?.send({
                        embeds: [
                            transcriptEmbed
                        ]
                    })
                }
            }

            if (config.logChannel){
                const b = await interaction.client.channels.fetch(config.logChannel);

                if (b && b.isTextBased()){
                    await b.send({
                        embeds: [
                            transcriptEmbed
                        ]
                    })
                }
            }

            const rle = await interaction.guild.roles.fetch(t.ticketRoleId);

            if (rle){
                await rle.delete();
            }
            
            if (q){
                await q.delete()
            }

            await Ticket.updateOne({_id:t._id},{
                $set:{closed: true}
            });
        }else{
            interaction.reply({content: "*Insufficient permissions - Manage Channel permissions required to force resolve ticket*",ephemeral:true})
        }
    }else if (interaction.customId == 'enlist' && config && interaction.member){
        const activeRole = config.activeRole;
        const inactiveRole = config.inactiveRole;

        if (!activeRole) {
            interaction.reply({content: '*Error: Active Role has not been configured*',ephemeral:true});
            return;
        }

        if (!inactiveRole) {
            interaction.reply({content: '*Error: Inactive Role has not been configured*',ephemeral:true});
            return;
        }

        if ((interaction.member.roles as GuildMemberRoleManager).cache.some((v) => {return v.id == activeRole})){
            interaction.reply({content: `*You've already enlisted! Get out there and fight*`,ephemeral:true});
            return;
        }else{
            (interaction.member.roles as GuildMemberRoleManager).add(activeRole);
            interaction.reply({content: '*Successfully signed up for war ' + (config.currentWar) +' *',ephemeral:true});
            return;
        }
    }else if (interaction.customId.startsWith('reset_reminder_') && config && interaction.member){
        console.log(interaction);
        
        const reminderIndex = config.activityReminderIds?.indexOf(interaction.customId.substring(15, interaction.customId.length));
        if (reminderIndex == -1 || !reminderIndex || !config.activityReminderRoles) {
            interaction.reply({content: "Error finding reminder",ephemeral:true})
            return
        };

        console.log(config);
        

        const rl = await interaction.guild?.roles.fetch(config.activityReminderRoles[reminderIndex]);
        const newReminderId = Math.random().toString(36).slice(2, 21);

        if (rl && (interaction.member.roles as GuildMemberRoleManager).cache.has(rl.id)){
            let q = config.activityReminderRoles;
            let z = config.activityReminderRolesTimeLimit;
            let m = config.activityReminderTimeStarted;
            let v = config.activityReminderResettable;
            let e = config.activityReminderChannel;
            let d = config.activityReminderIds;

            if (!z || !d || !q || !m || !v || !e) {
                interaction.reply({content: "Error verifying reminder information",ephemeral:true})
                return
            }

            const indx = q.indexOf(rl.id);

            m[indx] = new Date().getTime(); 
            d[indx] = newReminderId;

            const reminderEmbed = createOracleEmbed('Activity Reminder' , "Go be active and stuff!", [
                {name: 'Next Reminder', value: `<t:${Math.round(new Date(new Date().getTime() + (3600000 * z[indx])).getTime() / 1000)}:t>`},
                {name: 'Last Reset By', value: interaction.user.username}
            ] , "");

            
            console.log(interaction.message.id);
            
            interaction.message.edit({
                content: `<@&${q[indx]}>`,
                embeds: [reminderEmbed],
                components: v[indx] ? [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: "Reset Timer",
                            custom_id: "reset_reminder_" + newReminderId
                        }
                    ]
                }] : []
            })

            interaction.reply({content: "**Timer Reset** by <@" + interaction.user.id + ">",ephemeral:true})

            await config.updateOne({},{$set:{
                activityReminderRolesTimeLimit: z,
                activityReminderTimeStarted: m,
                activityReminderResettable: v,
                activityReminderChannel: e,
                activityReminderIds: d
            }})
        }else{
            if (!rl){
                interaction.reply({content: "Invalid role selected for reminder",ephemeral:true})
            }else{
                interaction.reply({content: "You must have the mentioned role in order to reset the timer",ephemeral:true})
            }
            
        }
    } else {
        return true
    }
}

export default buttonHandlerOracle