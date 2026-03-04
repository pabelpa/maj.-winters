import { Db, MongoClient} from 'mongodb'
import { EmptyStatement } from 'typescript';
let db: Db
let mongoClientObj: any;

interface Battalion {
    guildId: string;
    name: string;
    stockpileName: string;
    squads: Array<{
        squadType: string;
        variant: string;
        count: number;
    }>;
    depletionThreshold: number;
    openManifestIds?: string[];   // ticketIds of currently open manifests for this battalion
    forumThreadId?: string;       // forum thread in the battalion forum channel
    createdAt: Date;
    createdBy: string;
}

interface FAC {
    guildId: string;
    threadId: string;
    location: string;
    customName?: string;
    msuppConsumption?: Array<{
        zoneName: string;
        hourlyRate: number;
        currentStock: number;
        expireDate?: Date;
    }>;
    exports?: string[];
    imports?: string[];
    procedures?: string;
    msups?: number; // Legacy field, keeping for compatibility
    notes?: string;
    createdBy: string;
    createdAt: Date;
}

interface GuildConfig {
    guildId: string;
    facChannel?: string;
    rankRoles?: string[];
    logiTicketChannel?: string;
    botChannelCategory?: string;
    activeRole?: string;
    inactiveRole?: string;
    battalionForumChannelId?: string;  // forum channel for battalion status posts
    squadToeForumChannelId?: string;   // forum channel for squad TOE variant posts
}

interface Ticket 
{
    guildId : string;
    ticketId: string;
    channelId: string; 
    ticketRoleId: string;  
    author: string;
    transcript: string[]; 
    data: number[];
    newUserTicket: Boolean;
    logisticsTypes: string[];
    location: string;
    demanded: number[];
    delivered: number[];
    notes: string;
    complete: Boolean;
    ticketPostEmbed: string;
    ticketPostChannel: string;
    thread: string;
    threadMessageHeader: string;
    updateEmbed: string;
    title: string;
    closed : Boolean;
}

const open = async (): Promise<boolean> => {
    let uri = "mongodb://localhost:27017"
    if (process.env.MONGODB_URI) {
        uri = process.env.MONGODB_URI
    }

    console.info("Connecting to MongoDB at " + uri)

    const status = await MongoClient.connect(uri, {
    }).then(async (client) => {
        mongoClientObj = client

        console.info("MongoDB connected successfully!")
        return true
    }).catch((error) => {
        console.error(error)
        console.error("Error connecting to MongoDB")
        return false
    })
    return status
}

const getMongoClientObj = (): MongoClient => {
    return mongoClientObj
}

const getCollections = (serverID?: any) => {


    const db:Db = mongoClientObj.db(process.env.MONGODB_DB ?? 'stockpiler')
    const collections = {
        stockpiles: db.collection('stockpiles'),
        targets: db.collection('targets'),
        config: db.collection('config'),
        facilities:db.collection('facilities'),
        tickets:db.collection<Ticket>('tickets'),
        members:db.collection('members'),
        facs:db.collection<FAC>('facs'),
        guildConfig: db.collection<GuildConfig>('guildConfig'),
        battalions: db.collection<Battalion>('battalions')
    }
    return collections
    

}


export { open, getCollections, getMongoClientObj }
export type { Battalion }
