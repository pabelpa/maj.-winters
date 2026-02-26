import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import fs from "fs";
const unlock = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let tech = interaction.options.getString("tech")!
    let vic_tech: any = NodeCacheObj.get("vic_tech");
    let inf_tech: any = NodeCacheObj.get("inf_tech");
    const collections = getCollections()

    const configObj = (await collections.config.findOne({}))!

    if (configObj.unlocks){
        let newItemList
        if(vic_tech[tech]){
            newItemList = vic_tech[tech]
        } else if (inf_tech[tech]){
            newItemList = inf_tech[tech]
        } else {
            interaction.followUp({content:"The tech you specified is not in our database"})

        }
        configObj.unlocks.push(newItemList)
    }

    return true
}