import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: any) => {
    if (!res.socket.server.io) {
        console.log("*First use, starting socket.io*");
        const path = "/api/socket/io";
        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: path,
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("Client connected", socket.id);

            // Broadcast user count
            io.emit("user-count", io.engine.clientsCount);

            socket.on("chat-message", (message) => {
                // Broadcast to all clients including sender (or use broadcast.emit for others only)
                io.emit("chat-message", message);
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected", socket.id);
                // Broadcast user count update
                io.emit("user-count", io.engine.clientsCount);
            });
        });
    }
    res.end();
};

export default ioHandler;
