import { io } from "socket.io-client";

// Resolve the socket base URL for both dev (vite on 5000) and prod.
const getSocketURL = () => {
  // If a custom endpoint is provided, respect it (useful for staging).
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    // In dev, Vite runs on 5000 while the API/socket server listens on 3000.
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }

    // In production, keep same origin (falls back to render URL below if blank).
    if (port) return `${protocol}//${hostname}:${port}`;
    return `${protocol}//${hostname}`;
  }

  // Fallback for non-browser contexts.
  return "https://my-michelin-restaurant.onrender.com";
};

const socket = io(getSocketURL());

export default socket;
