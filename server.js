const express = require('express');
const fstat = require('fs');
const app = express()
const server = require('https')
const path=require('path');
// const cors = require('cors')
// app.use(cors())



const sslServer=server.createServer({

  key:fstat.readFileSync(path.join(__dirname,'cert','key.pem')),
  cert:fstat.readFileSync(path.join(__dirname,'cert','cert.pem'))

},app)

const io = require('socket.io')(sslServer)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(sslServer, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

sslServer.listen(3060,()=>console.log("connected"));