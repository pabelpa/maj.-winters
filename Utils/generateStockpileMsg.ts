import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Embed } from 'discord.js';
import { getCollections } from '../mongoDB';
import { createStockpileEmbeds } from './createStockpileEmbed';
import { EmbedBuilder } from '@discordjs/builders';



const generateStockpileMsg = async (updateMsg: boolean, stockpile:any): Promise<Array<any>> => {
    const collections = getCollections()
    
    let stockpileEmbeds = (NodeCacheObj.get("stockpileMsgs") as any)[stockpile._id] as Array<EmbedBuilder>

    const refreshAll = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('sprefreshall==')
                .setLabel("Refresh All Stockpiles")
                .setStyle(ButtonStyle.Success)
        );


    if (updateMsg || !stockpileEmbeds) {
        const configObj = (await collections.config.findOne({}))!
     
        const stockpileGroups: any = NodeCacheObj.get("stockpileGroups")
        stockpileEmbeds = await createStockpileEmbeds(stockpile)

        let cachedEmbeds = (NodeCacheObj.get("stockpileMsgs") as any)
        cachedEmbeds[stockpile._id]=stockpileEmbeds
        NodeCacheObj.set("stockpileMsgs", cachedEmbeds)
    }
    return stockpileEmbeds
}


export default generateStockpileMsg
