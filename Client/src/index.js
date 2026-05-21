import React from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from "./App";
import { store } from "./store/store";
import PersistProvider from "./store/providers/persist-provider";
import 'animate.css';
import 'swiper/swiper-bundle.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-modal-video/css/modal-video.css';
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./assets/css/style.css";
import "./i18n";
import "../src/assets/css/headerTop.css";

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <Provider store={store}>
      <PersistProvider>
        <App />
      </PersistProvider>
    </Provider>
);