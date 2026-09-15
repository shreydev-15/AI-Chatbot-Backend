require('dotenv').config();
const { createServer } = require("http");
const { Server } = require("socket.io");
const app  = require('./src/app');
const { generateResponse } = require('./src/services/ai.service');

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
    }
});

io.on("connection", (socket) => {
    console.log('A user connected');
    const chatHistory = [];

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    })

    socket.on("ai-message", async (data)=>{
        if (typeof data !== 'string' || !data.trim()) {
            socket.emit('ai-error', 'Please enter a message.');
            return;
        }

        chatHistory.push({
            role: "user",
            parts: [{ text: data.trim() }]
        })

        try {
            const response = await generateResponse(chatHistory);
            socket.emit('ai-response', response );
            console.log('Response generated:', response);
            chatHistory.push({
                role: "model",
                parts: [{ text: response }]

            })
        } catch (error) {
            console.error('Gemini request failed:', error.message);
            chatHistory.pop();
            socket.emit('ai-error', 'Unable to generate a response right now.');
        }
    })
}); 



httpServer.listen(3007, () => {
    console.log('Server is running on port 3007');
})
