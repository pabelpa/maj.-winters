import { Client, TextChannel } from "discord.js"
import { getCollections } from "../mongoDB"
import { roleMention } from '@discordjs/builders';
const resetXp = async () => {
    
    console.log("Checking xp now")


    const collections = getCollections()
    let soldiers = await collections.members.find({}).toArray()


    for (const i in soldiers) {
        let soldier:any = soldiers[i]
        collections.members.updateOne({_id:soldier._id},{$set:{xpGiven:0}})
    }
}

export default resetXp