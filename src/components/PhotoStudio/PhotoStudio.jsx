import { Outlet } from "react-router-dom";

import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";
import ChatBot from "./ChatBot/ChatBot";

import "./PhotoStudio.css";

function PhotoStudio() {
    return (
        <div className="photo-studio">
            <Navbar />

            <main className="photo-studio-main">
                <Outlet />
            </main>

            <Footer />
            <ChatBot />
        </div>
    );
}

export default PhotoStudio;
