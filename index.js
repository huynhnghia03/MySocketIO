require('dotenv').config()
const express = require('express');
const app = express();
const server = require('http').Server(app);
const PORT = process.env.PORT;
server.listen(PORT)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
}));
const io = require("socket.io")(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    },
});
let activeUsers = []
let activeComments = []
io.on('connection', (socket) => {
    socket.on('add-new-user', (newUserID) => {
        if (!activeUsers.some((user) => user.userID === newUserID)) {
            console.log('connected')
            activeUsers.push({
                userID: newUserID,
                socketID: socket.id
            })
        }
        io.emit('get-users', activeUsers)
    })
    socket.on('add-new-comment', (courseID) => {
        if (!activeComments.some((comment) => comment.courseID === courseID)) {
            console.log('connected')
            activeComments.push({
                courseID: courseID,
                socketID: socket.id,
            })
        }
    })

    socket.on('disconnect', () => {
        activeUsers = activeUsers.filter((user) => user.socketID !== socket.id)
        activeComments = activeComments.filter((user) => user.socketID !== socket.id)
        io.emit('get-users', activeUsers)
    })

    socket.on('send-message', (data) => {
        const { receiverId } = data
        const user = activeUsers.find((user) => user.userID === receiverId)
        if (user) {

            io.to(user.socketID).emit('recive-message', data)
        }
    })
    socket.on('send-comment', (allData) => {
        const { datas, user, comments } = allData

        const { course_id, commenttable_type } = datas
        const comment = activeComments.find((comment) => {
            return comment.courseID === course_id
        })

        if (comment) {
            const newData = { course_id: course_id, datas, commenttable_type, receivedComments: [{ ...datas, user }, ...comments] }
            console.log(newData)
            socket.broadcast.emit('recive-comment', newData)
        }
    })
    socket.on('delete-comment', (data) => {
        const { comments, commenttable_id, parentID, course_id, type } = data
        console.log(activeComments)
        const newComments = comments.filter((comment) => {
            return comment.commenttable_id !== commenttable_id
        })
        if (newComments) {
            socket.broadcast.emit('respond-delete-comment', { course_id, parentID, type, newComments })
        }
    })
    socket.on('update-comment', (data) => {
        const { comment, commenttable_id, type, course_id, comments, } = data
        console.log(data)
        const index = comments.findIndex((comment) => {
            return comment.commenttable_id === commenttable_id
        })

        if (index !== undefined) {
            comments[index].comment = comment
            console.log(comments)
            socket.broadcast.emit('update-respond-comment', { course_id, type, comments })
        }
    })
    socket.on('send-commentBlog', (allData) => {
        const { datas, user, comments } = allData

        const { blog_id, commenttable_type } = datas
        const comment = activeComments.find((comment) => {
            return comment.courseID === blog_id
        })

        if (comment) {
            const newData = { blog_id, datas, commenttable_type, receivedComments: [{ ...datas, user }, ...comments] }
            console.log(newData)
            socket.broadcast.emit('recive-commentBlog', newData)
        }
    })
    socket.on('delete-commentBlog', (data) => {
        const { comments, commenttable_id, parentID, blog_id, type } = data
        console.log(activeComments)
        const newComments = comments.filter((comment) => {
            return comment.commenttable_id !== commenttable_id
        })
        if (newComments) {
            socket.broadcast.emit('respond-delete-commentBlog', { blog_id, parentID, type, newComments })
        }
    })
    socket.on('update-commentBlog', (data) => {
        const { comment, commenttable_id, type, blog_id, comments, } = data
        console.log(data)
        const index = comments.findIndex((comment) => {
            return comment.commenttable_id === commenttable_id
        })

        if (index !== undefined) {
            comments[index].comment = comment
            console.log(comments)
            socket.broadcast.emit('update-respond-commentBlog', { blog_id, type, comments })
        }
    })
})
app.get('/', (req, res) => {
    res.send('Socket.IO server is running');
});
