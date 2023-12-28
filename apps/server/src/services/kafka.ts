import { Kafka, Producer } from "kafkajs";
import fs from 'fs'
import path from "path";
import prismaClient from "./prisma";
import 'dotenv/config'

const kafka = new Kafka({
    brokers:[process.env.kafkaURI?process.env.kafkaURI:""],
    ssl:{
        ca: [fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')],
    },
    sasl:{
        username:process.env.kafkaUsername?process.env.kafkaUsername:"",
        password:process.env.kafkaPassword?process.env.kafkaPassword:"",
        mechanism:'plain'
    }
})

let producer:Producer|null=null;
export async function createProducer() {
    if(producer) return producer;
    const _producer = kafka.producer();
    await _producer.connect();
    return _producer;
}

export async function produceMessage(message:string) {
    const producer = await createProducer();
    await producer.send({
        topic: 'MESSAGES',
        messages: [
            { key: `message-${Date.now()}`, value: message },
        ],
    })
    return true;
}

export async function startMessageConsumer(){
    console.log("Consumer is running")
    const consumer = kafka.consumer({ groupId: 'default' });
    await consumer.connect()
    await consumer.subscribe({ topics: ['MESSAGES'] , fromBeginning:true})

    await consumer.run({
        autoCommit:true,
        eachMessage: async ({message, pause }) => {
            console.log("Message value",message.value?.toString());
            if(!message.value) return;
            try{
                await prismaClient.message.create({
                    data:{
                        text:message.value?.toString(),
                    }
                })
            }catch(err){
                console.log("Something is wrong");
                pause();
                setTimeout(()=>{
                    consumer.resume([{topic:'MESSAGES'}])
                },60*1000);
            }
        },
    })
}

export default kafka;