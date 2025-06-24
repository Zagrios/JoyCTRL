import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Keyboard } from "./Keyboard";

const keyboardNode = document.getElementById("keyboard");

if (keyboardNode !== null) {
  ReactDOM.createRoot(keyboardNode).render(
    <StrictMode>
      <Keyboard />
    </StrictMode>,
  );
} else {
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <StrictMode>
          <App />
        </StrictMode>,
    );
}