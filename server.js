const express = require('express');
const socket = require('socket.io');

const PORT  =5000 ;
const app = express();

const server = app.listen(PORT,()=>{

    console.log(`server is listening on${PORT}`)
    console.log(`http://localhost:${PORT}`)
})

const io = socket(server,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }
})

let peers=[]
let botzList=[]

io.on('connection',(socket)=>{

    socket.emit('connection',null)
    console.log('new user connected')
    console.log(socket.id)

    socket.on('register-new-bot',(data)=>{
        
        botzList.push({
            bot:data.username,
            id:socket.id,
            botStatus:'UNAVAILABLE',
            connectedUser:null,
        })
        io.sockets.emit('broadcast',{
            event:'ACTIVE_BOTZ',
            activeBotz:botzList

        })

        console.log(botzList)
    })

    socket.on('register-new-user',(data)=>{

        peers.push({
            username:data.username,
            socketId:data.socketId
        });
        console.log('registered a user ')
        console.log(peers)
    io.sockets.emit('broadcast',{
        event:'ACTIVE_USERS',
        activeUsers:peers
         });
    io.sockets.emit('broadcast',{
        event:'ACTIVE_BOTZ',
        activeBotz:botzList
    })
    console.log(botzList)
    });

    socket.on('disconnect',()=>{

        console.log('user disconnected',socket.id)
        peers = peers.filter((peer)=>peer.socketId !== socket.id)
        botzList = botzList.filter((bot)=>bot.id !== socket.id)
        console.log('newbotlist:',botzList)
        io.sockets.emit('broadcast',{
            event:'ACTIVE_USERS',
            activeUsers:peers
        })
        io.sockets.emit('broadcast',{
            event:'ACTIVE_BOTZ',
            activeBotz:botzList
        })
    })

    socket.on('pre-offer',(data)=>{
        console.log('got a pre offer ',data)
        console.log(data.callee.socketId)
        io.to(data.callee.socketId).emit('pre-offer',{
            
            
                callerUsername:data.caller.username,
                callerSocketId:socket.id
            
            
        })

        
    })


    socket.on('pre-offer-answer',(data)=>{
        console.log('got the reject asnswer',data)

        io.to(data.socketId).emit('pre-offer-answer',(
            {
                answer:data.answer
            }
        ))
    })

    socket.on('webRTC-offer',(data)=>{

        console.log('handling web rtc offer')
        console.log(data)
        io.to(data.calleeSocketId).emit('webRTC-Offer',{
            offer:data.offer
        })
    })

    socket.on('webRTC-answer',(data)=>{
        

        io.to(data.callerSocketId).emit('webRTC-answer',{

            answer:data.answer
        })
    })

    socket.on('webRTC-candidate',(data)=>{
        console.log('recieved  candidate',data)
        io.to(data.connectedUserSocketId).emit('webRTC-candidate',({
            candidate:data.candidate
        }))
    })






    /////////////////////////////////////////////////////////// bot listeners///////////////////////////////////////7


    socket.on('bot-pre-offer',(data)=>{
        console.log('should match the dat',data)
      selectedBot =  botzList.find(bot => bot.id ===data.bot.id)
      console.log('I found the selected bot',selectedBot)
      if (selectedBot){
          if(!selectedBot.botStatus ==='AVAILABLE'){
              console.log(selectedBot.botStatus)

            io.to(socket.id).emit('bot-pre-offer-answer',({
                answer:'REJECTED',

            }))
            return


          }
      }
    
        

     io.to(data.bot.id).emit('bot-pre-offer',{
        
        username: data.user,
        usernameSocketId : socket.id
     })

    })

    socket.on('bot-pre-offer-answer',(data)=>{
        const newData ={
            ...data,
            botSocketId:socket.id
        }
        console.log('hello,',data,newData)
        io.to(data.usersocketId).emit('bot-pre-offer-answer',newData)
        

    })
    socket.on('bot-web-rtc-offer',(data)=>{
        console.log('this is the bot web rtc offer',)
        newdata={
            ...data,
            userSocket:socket.id
        }
        io.to(data.botCallingSocketId).emit('bot_webrtc_offer',(newdata))
    })

    socket.on('bot_web_rtc_answer',(data)=>{
        console.log('success bois!')
        console.log(data)
    })


    
})


