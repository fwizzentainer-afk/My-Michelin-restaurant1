import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    const shouldReload = window.confirm(
      "Nova versao disponivel do app. Deseja atualizar agora?",
    );
    if (shouldReload) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("PWA pronto para uso offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
