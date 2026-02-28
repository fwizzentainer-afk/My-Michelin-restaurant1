import { io } from "socket.io-client";

const getSocketURL = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `http://localhost:${window.location.port || 3000}`;
  }
  return "https://my-michelin-restaurant.onrender.com";
};

const socket = io(getSocketURL());

export default socket;
