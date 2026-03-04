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

const battalionAC = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const battalions = await collections.battalions.find({ guildId: interaction.guildId }).toArray();
    const filtered: Array<ApplicationCommandOptionChoiceData> = [];
    for (const b of battalions) {
        if (b.name.toLowerCase().includes(focusedValue)) {
            filtered.push({ name: b.name, value: b.name });
        }
        if (filtered.length >= 25) break;
    }
    await interaction.respond(filtered);
};

const squadTypeAC = async (interaction: AutocompleteInteraction, _collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const toeData: any = NodeCacheObj.get('toe') ?? {};
    const filtered: Array<ApplicationCommandOptionChoiceData> = [];
    for (const typeName of Object.keys(toeData)) {
        if (typeName.toLowerCase().includes(focusedValue)) {
            filtered.push({ name: typeName, value: typeName });
        }
        if (filtered.length >= 25) break;
    }
    await interaction.respond(filtered);
};

const squadVariantAC = async (interaction: AutocompleteInteraction, _collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const toeData: any = NodeCacheObj.get('toe') ?? {};
    // Try to read the squad type from either `squad_type` (battalion cmd) or `type` (squad-type cmd)
    const typeName = interaction.options.getString('squad_type') ?? interaction.options.getString('type') ?? '';
    const typeDef = toeData[typeName];
    const filtered: Array<ApplicationCommandOptionChoiceData> = [];
    if (typeDef) {
        for (const variantName of Object.keys(typeDef).filter(k => k !== 'size')) {
            if (variantName.toLowerCase().includes(focusedValue)) {
                filtered.push({ name: variantName, value: variantName });
            }
            if (filtered.length >= 25) break;
        }
    }
    await interaction.respond(filtered);
};

const techAC = async (interaction: AutocompleteInteraction, collections: any) => {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const vic_tech: any = NodeCacheObj.get("vic_tech");
    const inf_tech: any = NodeCacheObj.get("inf_tech");

    const config = await collections.config.findOne({})
    const unlockedItems: string[] = config?.unlockedItems ?? [];

    const unlockedSet = new Set<string>(
        unlockedItems.map((item: string) => item.toLowerCase().replace(/\./g, "_"))
    );

    const allTechs = new Set<string>([...Object.keys(vic_tech), ...Object.keys(inf_tech)]);
    const filtered: Array<ApplicationCommandOptionChoiceData> = [];

    for (const tech of allTechs) {
        if (filtered.length >= 25) break;
        if (!tech.toLowerCase().includes(focusedValue)) continue;

        const items: string[] = vic_tech[tech] ?? inf_tech[tech] ?? [];
        const hasLocked = items.some(
            item => !unlockedSet.has(item.toLowerCase().replace(/\./g, "_"))
        );
        if (hasLocked) {
            filtered.push({ name: tech, value: tech });
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
    'give-xp':{'type': xpTypeAC,},
    'unlock': {'tech': techAC,},
    'battalion': {
        'name': battalionAC,
        'stockpile': spStockpileComplete,
        'battalion': battalionAC,
        'squad_type': squadTypeAC,
        'variant': squadVariantAC,
    },
    'squad-type': {
        'name': squadTypeAC,
        'type': squadTypeAC,
        'variant': squadVariantAC,
    },
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
