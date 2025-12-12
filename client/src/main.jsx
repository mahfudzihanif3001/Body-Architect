import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./pages/store.js";
import "./index.css";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="973180735430-2nk8ft5okcoofmga824n4dcro4cnjqkp.apps.googleusercontent.com">
      <Provider store={store}>
        <App />
      </Provider>   
    </GoogleOAuthProvider>
  </StrictMode>
);
