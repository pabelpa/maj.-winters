import { getCollections } from '../mongoDB'
import { ChatInputCommandInteraction } from 'discord.js';
import fs from "fs";
const setActiveRole = async (interaction: ChatInputCommandInteraction): Promise<boolean> => {
    let jFile = await fs.promises.readFile("../toe.json")
    return true
}