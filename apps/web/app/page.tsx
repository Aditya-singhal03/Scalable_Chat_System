'use client'
import React, { useState } from 'react'
import classes from "./page.module.css";
import { useSocket } from './context/SocketProvider';

const page = () => {
  const [message,setMessage] = useState("");
  const {sendMessage,messages} = useSocket();
  return (
    <div>
      <div>
        <input type="text" placeholder='Message..'  className={classes["chat-input"]} value={message} onChange={(e)=>setMessage(e.target.value)}/>
        <button onClick={(e)=>sendMessage(message)} className={classes["button"]}>Send</button>
      </div>
      <div>
        <h1>{messages.map((msg,idx)=>(
          <li key={idx}>{msg}</li>
        ))}</h1>
      </div>
    </div>
  )
}

export default page