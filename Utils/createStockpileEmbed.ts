import { EmbedBuilder,ButtonBuilder,ActionRowBuilder } from "@discordjs/builders"
import { ButtonStyle, Embed } from "discord.js"
import { getCollections } from "../mongoDB"
import { validateHeaderName } from "http"
let categories:string[] = []
const generateSubCatString = (cat:string,stockpile:any,embedArray:Array<EmbedBuilder>,name:string,color:any)=>{
    let specialCrates:any = NodeCacheObj.get("specialCrates")
    let subCats:any = NodeCacheObj.get("subCategories")
    let lowerToOriginal:any = NodeCacheObj.get("lowerToOriginal")
    let current = subCats[cat.replace("-","")]
    let msg = ""
    let empty = true
    let currentEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(cat.padEnd(44,"-"))
    for (let i=0;i<current.length;i++){
        
        if (name=="Vehicles"||name=="Shippables"){
            let item = current[i]
            if (item in stockpile.items || (item+" crate") in stockpile.items){


                if (item in specialCrates && (item+" crate") in stockpile.items){
                    let multiplier = specialCrates[item]
                    let basicAmount = stockpile.items[item]? stockpile.items[item]:0
                    let total = basicAmount+stockpile.items[item+" crate"]*multiplier
                    msg+= total+ " - `" + lowerToOriginal[item] + "`" +`(${stockpile.items[item+" crate"]*multiplier} are in crates)`+ "\n"
                } else {
                    msg+= stockpile.items[item]+ " - `" + lowerToOriginal[item] + "`" + "\n"
                }
            }
        }else{
            let item = current[i]+" crate"
            if (item in stockpile.items){
                msg+=stockpile.items[item] + " - `" + lowerToOriginal[item] + "`" + "\n"
            }

        }
    }
    if (msg){
        empty=false
        currentEmbed.setDescription(
            msg
        )
        embedArray.push(currentEmbed)
    }
    return empty
}


categories = [
    "Rifle",
    "Automatic Rifle",
    "Machine Gun",
    "Misc. Small Arms",
    "Light Kinetic Ammo",
    "Heavy Kinetic Ammo",
    "Light Grenade",
    "20mm Weaponry",
    "AT Weaponry",
    "Mortar Weaponry",
    "30mm Weaponry",
    "Heavy Grenade",
    "Incindiary",
    "Artillery Shells",
    "Tank Munitions",
    "Anti Ship",
    "Rocket Ammunition",
    "Engineering",
    "Intelligence",
    "Demolition",
    "Misc. Equipment",
    "Medical",
    "Materials",
    "Raw Materials",
    "Tech Mats",
    "Fuel",
    "Assembly Materials",
    "Construction Materials",
    "Assault Uniforms",
    "Engineering Uniforms",
    "Recon Uniforms",
    "Utility",
    "Armor",
    "Light Armor",
    "Heavy Armor",
    "Field Gun",
    "Scout",
    "Rocket",
    "Aquatic",
    "Logistics",
    "Emplacements",
    "Naval",
    "Large Structure",
    "Ballistic",
]
const createStockpileEmbeds = async (stockpile:any):Promise<EmbedBuilder[]>=>{
    let output :any ={}
    let empty_i
    let stockpileInfo = [
        {
            name: "Small Arms",
            cats: [
                "Rifle",
                "Automatic Rifle",
                "Machine Gun",
                "Misc. Small Arms",
                "Light Kinetic Ammo",
                "Light Grenade"
            ],
            desc: "Rifles and ammo.",
            color: 0x0099FF
        },
        {
            name: "Heavy Arms",
            cats: [
                "20mm Weaponry",
                "AT Weaponry",
                "Mortar Weaponry",
                "30mm Weaponry",
                "Heavy Grenade",
                "Incindiary"
            ],
            desc: "AT and explosions",
            color: 0x0099FF
        },
        {
            name: "Heavy Ammunition",
            cats: [
                "Artillery Shells",
                "Tank Munitions",
                "Anti Ship",
                "Rocket Ammunition",
            ],
            desc: "Tank and Artillery Shells",
            color: 0x0099FF
        },
        {
            name: "Utility",
            cats: [
                "Engineering",
                "Intelligence",
                "Demolition",
                "Misc. Equipment",
            ],
            desc: "Tools and building equipment",
            color: 0x0099FF
        },
        {
            name: "Medical",
            cats: [
                "Medical",
            ],
            desc: "Livesavers",
            color: 0x0099FF
        },
        {
            name: "Resource",
            cats: [
                "Materials",
                "Raw Materials",
                "Tech Mats",
                "Fuel",
                "Assembly Materials",
                "Construction Materials",
            ],
            desc: "building blocks",
            color: 0x0099FF
        },
        {
            name: "Uniforms",
            cats: [
                "Assault Uniforms",
                "Engineering Uniforms",
                "Recon Uniforms",
            ],
            desc: "Drip",
            color: 0x0099FF
        },
        {
            name: "Vehicles",
            cats: [
                "Utility",
                "Armor",
                "Light Armor",
                "Heavy Armor",
                "Field Gun",
                "Scout",
                "Rocket",
                "Aquatic",
            ],
            desc: "vroooom",
            color: 0x0099FF
        },
        {
            name: "Shippables",
            cats: [
                "Logistics",
                "Emplacements",
                "Naval",
                "Large Structure",
                "Ballistic",
            ],
            desc: "flatbed not included",
            color: 0x0099FF
        },

    ]
    for (let j=0;j<stockpileInfo.length;j++){
        let currentEmpty = true
        let currentCat = stockpileInfo[j];
        let currentEmbeds = new Array();
        let currentMsg:any = {}
        currentMsg["content"] = "# "+currentCat.name

        let sub = currentCat.cats
        for (let i = 0;i<sub.length;i++){
            empty_i = generateSubCatString(sub[i],stockpile,currentEmbeds,currentCat.name,currentCat.color)
            currentEmpty = currentEmpty && empty_i
        }
        if (!currentEmpty){
            currentMsg["embeds"]=currentEmbeds
        }else{
            currentMsg["content"]=currentMsg["content"]+"\n\n None"
        }
        output[currentCat.name]=currentMsg
    }




    

    
    return output
}

export {categories,createStockpileEmbeds}