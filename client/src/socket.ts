import { io } from "socket.io-client";

const socket = io("https://my-michelin-restaurant.onrender.com");

export default socket;
