import { Server } from "socket.io";
import  Redis  from "ioredis";
import 'dotenv/config'
import prismaClient from "./prisma";
import { produceMessage } from "./kafka";

const host = process.env.host;
const port = process.env.port ? parseInt(process.env.port, 10) : undefined;
const username = process.env.username;
const password = process.env.password;

const pub = new Redis({
    host:host,
    port:port,
    username:username,
    password:password
});
const sub = new Redis({
    host:host,
    port:port,
    username:username,
    password:password
});

class SocketService {
    private _io:Server;

    constructor(){
        console.log("Init Socket Server..")
        this._io = new Server({
            cors:{
                allowedHeaders:['*'],
                origin: '*'
            }
        });
        sub.subscribe("MESSAGE");
    }

    public initListener(){
        const io = this.io;
        console.log("Init Socket Listeners...");
        io.on('connect',(socket)=>{
            console.log(`New Socket Connected`,socket.id);

            socket.on('event:message',async ({message}:{message:string})=>{
                console.log("New message received ",message);

                await pub.publish("MESSAGE",JSON.stringify({message}));
            })
        });
        sub.on('message',async (channel,message)=>{
            if(channel==="MESSAGE"){
                console.log("message from redis on server",message);
                io.emit('message',message);
            }
            await produceMessage(message);
            console.log("message produced to kafka Broker")
        })
    }

    get io(){
        return this._io;
    }
}

export default SocketService;