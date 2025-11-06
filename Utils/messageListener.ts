import { Message } from "discord.js";
import { getCollections } from "../mongoDB";
const  recordLogiTicket = async (msg:Message)=>{
    if (msg.author.bot || !msg.guildId) return;

    
    const q = await getCollections().tickets.findOne({
        channelId: msg.channelId
    })

    if (q){
        console.log(msg.content)
        await getCollections().tickets.updateOne({_id:q._id},
            {
            $push: {transcript: msg.author.username + " (" + msg.createdAt.toTimeString() + "): " + msg.content}
        })
    }
    return
}

export default recordLogiTicket