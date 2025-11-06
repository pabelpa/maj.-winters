import { Client, ChatInputCommandInteraction, GuildMember, TextChannel,ForumChannel } from "discord.js";
import { getCollections } from '../mongoDB';
import checkPermissions from "../Utils/checkPermissions";

const spremovelogichannel = async (interaction: ChatInputCommandInteraction, client: Client): Promise<boolean> => {
    const collections = getCollections()
    const configDoc = (await collections.config.findOne({}))!

    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false

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
            }
            catch (e) {
                console.log("Failed to delete thread for stockpile "+stockpile.name)
            }
        }
        collections.config.updateOne({}, {$unset:{stockpileChannelId:1}})
    } else {
        await interaction.editReply({
            content: "Logi channel was not set. Unable to remove."
        });
    }





    return true;
}

export default spremovelogichannel
