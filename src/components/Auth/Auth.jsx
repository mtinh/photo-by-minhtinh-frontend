import { Link, Outlet } from "react-router-dom";

import "./Auth.css";

function Auth() {
    return (
        <div className="auth">
            <Link to="/" className="auth-brand">
                <span className="auth-logo">P</span>
                <span>Photos by MinhTinh</span>
            </Link>
            <Outlet />
        </div>
    );
}

export default Auth;
