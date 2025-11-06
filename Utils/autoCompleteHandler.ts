import { AutocompleteInteraction, ApplicationCommandOptionChoiceData } from "discord.js";
import { getCollections } from "../mongoDB";


const splocationComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();


    const locationMappings: any = NodeCacheObj.get("locationMappings")

    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    for (const code in locationMappings) {
        if (locationMappings[code].toLowerCase().indexOf(focusedValue) !== -1) {
            filtered.push({ name: locationMappings[code], value: code })
        }

        if (filtered.length >= 25) break
    }
    await interaction.respond(filtered);
}

const spStockpileComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const all_stockpiles = await collections.stockpiles.find({}).toArray();

    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    for (let i = 0; i < all_stockpiles.length; i++) {
        if (all_stockpiles[i].name.toLowerCase().indexOf(focusedValue) !== -1) {
            filtered.push({ name: all_stockpiles[i].name, value: all_stockpiles[i].name })
        }

        if (filtered.length >= 25) break
    }
    await interaction.respond(filtered);
}

const spFacComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const allFacs = await collections.facilities.find({}).toArray();

    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    for (let i = 0; i < allFacs.length; i++) {
        if (allFacs[i].name.toLowerCase().indexOf(focusedValue) !== -1) {
            filtered.push({ name: allFacs[i].name, value: allFacs[i].name })
        }

        if (filtered.length >= 25) break
    }
    await interaction.respond(filtered);
}

const deliverAC = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const t = await collections.tickets.findOne({
        complete: true,
        channelId: interaction.channelId
    })
    if (!t){
        await interaction.respond([])
        return
    }
    const items = t.logisticsTypes;
    if (items){

        console.log(items)
        const filtered: Array<ApplicationCommandOptionChoiceData> = []
        for (let i = 0; i < items.length; i++) {
            if (items[i].toLowerCase().indexOf(focusedValue) !== -1) {
                filtered.push({ name: items[i], value: items[i] })
            }
            
            if (filtered.length >= 25) break
        }
        console.log(filtered)
        await interaction.respond(filtered);
    } else {
        await interaction.respond([])
    }
}

const rankRoleAC = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const ranks = [
        "enlisted",
        "nco",
        "warrant",
        "officer",
        "commander",
        "chief",
        "eng1",
        "eng2",
        "eng3",
        "eng4",
        "fac1",
        "fac2",
        "fac3",
        "fac4",
        "logi1",
        "logi2",
        "logi3",
        "logi4",
        "logi5",
        "arty2",
        "arty3",
        "armor2",
        "armor3",
        "comb1",
        "comb2",
        "comb3",
        "comb4",
        "comb5",
    ]
    if (ranks){

        const filtered: Array<ApplicationCommandOptionChoiceData> = []
        for (let i = 0; i < ranks.length; i++) {
            if (ranks[i].toLowerCase().indexOf(focusedValue) !== -1) {
                filtered.push({ name: ranks[i], value: ranks[i] })
            }
            
            if (filtered.length >= 25) break
        }
        await interaction.respond(filtered);
    } else {
        await interaction.respond([])
    }
}

const xpTypeAC = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const xpTypes = [
        "combat",
        "logi",
        "engineering"
    ]
    if (xpTypes){

        const filtered: Array<ApplicationCommandOptionChoiceData> = []
        for (let i = 0; i < xpTypes.length; i++) {
            if (xpTypes[i].toLowerCase().indexOf(focusedValue) !== -1) {
                filtered.push({ name: xpTypes[i], value: xpTypes[i] })
            }
            
            if (filtered.length >= 25) break
        }
        await interaction.respond(filtered);
    } else {
        await interaction.respond([])
    }
}

const spGroupComplete = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();

    const config = await collections.config.findOne({})
    const filtered: Array<ApplicationCommandOptionChoiceData> = []
    if ("stockpileGroups" in config) {
        for (const group_name in config.stockpileGroups) {
            if (group_name.toLowerCase().indexOf(focusedValue) !== -1) {
                filtered.push({ name: group_name, value: group_name })
            }
            if (filtered.length >= 25) break
        }
    }

    await interaction.respond(filtered);
}

const commands: any = {
    'sploc': { 'location': splocationComplete, 'stockpile': spStockpileComplete },
    'spcode': { 'stockpile': spStockpileComplete },
    'spstockpile': { 'stockpile': spStockpileComplete },
    'spsetorder': { 'stockpile': spStockpileComplete },
    'spstatus': { 'stockpile': spStockpileComplete },
    'spprettyname': { 'stockpile': spStockpileComplete },
    'sprefresh': { 'stockpile': spStockpileComplete },
    'spsettimeleft': { 'stockpile': spStockpileComplete },
    'spsetamount': { 'stockpile': spStockpileComplete },
    'spgroup': { 'name': spGroupComplete, 'stockpile_name': spStockpileComplete },
    'spsetmsupp':{'name': spFacComplete,},
    'spmsuppcons':{'name': spFacComplete,},
    'spremovefac':{'name': spFacComplete,},
    'deliver':{'resource': deliverAC,},
    'set-rank-roles':{'rank': rankRoleAC,},
    'give-xp':{'type': xpTypeAC,}

}

const autoCompleteHandler = async (interaction: AutocompleteInteraction) => {
    try {
        const collections = process.env.STOCKPILER_MULTI_SERVER === "true" ? getCollections(interaction.guildId) : getCollections()

        commands[interaction.commandName][interaction.options.getFocused(true).name](interaction, collections)
    }
    catch (e) {
        console.log("Error occured in autoCompleteHandler")
        console.log(e)
    }

}

export default autoCompleteHandler
