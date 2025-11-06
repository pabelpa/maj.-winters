import { Db, MongoClient} from 'mongodb'
import { EmptyStatement } from 'typescript';
let db: Db
let mongoClientObj: any;

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


    const db:Db = mongoClientObj.db('stockpiler')
    const collections = {
        stockpiles: db.collection('stockpiles'),
        targets: db.collection('targets'),
        config: db.collection('config'),
        facilities:db.collection('facilities'),
        tickets:db.collection<Ticket>('tickets'),
        members:db.collection('members')
    }
    return collections
    

}


export { open, getCollections, getMongoClientObj }
