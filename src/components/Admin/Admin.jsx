import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import Header from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";
import UploadPanel from "./UploadPanel/UploadPanel";

import { useAuth } from "../../context/AuthContext";
import { UploadProvider } from "../../context/UploadContext";

import "./Admin.css";

function Admin() {
    const { user } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (user.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return (
        <UploadProvider>
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            <div className="layout">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="content">
                    <Outlet />
                </main>
            </div>

            <UploadPanel />
        </UploadProvider>
    );
}

export default Admin;
