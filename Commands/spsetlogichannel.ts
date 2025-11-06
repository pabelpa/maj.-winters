import { Client, ChatInputCommandInteraction, GuildMember, ActionRowBuilder, ButtonBuilder, TextChannel, ForumChannel } from "discord.js";
import { getCollections } from '../mongoDB';
import checkPermissions from "../Utils/checkPermissions";
import updateStockpileMsgEntryPoint from "../Utils/updateStockpileMsg";

const spsetlogichannel = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    try {
        const channel = interaction.options.getChannel("channel")! // Tell typescript to shut up and it is non-null

        if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

        if (!channel) {
            await interaction.editReply({
                content: "Missing parameters"
            });
            return false
        }

        const collections = getCollections()
        
        const configDoc = (await collections.config.findOne({}))!

        // Delete previous thread if it exists
        const stockpiles = await collections.stockpiles.find({}).toArray()
        if ("stockpileChannelId" in configDoc) {
            const oldChannel = client.channels.cache.get(configDoc.stockpileChannelId) as ForumChannel
            
            for (let i = 0; i < stockpiles.length; i++) {
                let stockpile = stockpiles[i]
                try {
                    let threadId = stockpile.thread
                    let thread = await oldChannel.threads.fetch(threadId)
                    if (thread){
                        await thread?.delete()
                    }
                    let newMsgIds:any = {}
                    await collections.stockpiles.updateOne({_id:stockpile._id},{$set:{msgIds:newMsgIds}})
                }
                catch (e) {
                    console.log("Failed to delete thread for stockpile "+stockpile.name)
                }
            }
        }

        let newChannel
        try{
            newChannel = client.channels.cache.get(channel.id) as ForumChannel
        } catch{
            console.log("there was an issue getting the new channel")
        }

        if (newChannel){
            collections.config.updateOne({},{$set:{stockpileChannelId:newChannel.id}})
            for (let i = 0; i < stockpiles.length; i++) {
                let stockpile = stockpiles[i]
                try {
                    stockpile = (await collections.stockpiles.findOne({_id:stockpile._id}))!
                    updateStockpileMsgEntryPoint(client,"",stockpile,false)
                }
                catch (e) {
                    console.log("Failed to create new thread for stockpile "+stockpile.name)
                }
            }

        }

        await interaction.editReply({
            content: "Logi channel successfully set to '" + channel.name + "'",
        });
        
    }
    catch (e) {
        console.log(e)
    }
    return true;
}

export default spsetlogichannel
