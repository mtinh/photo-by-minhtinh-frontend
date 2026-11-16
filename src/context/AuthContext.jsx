import { createContext, useCallback, useContext, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

const readUser = () => {
    try {
        const stored = localStorage.getItem("currentUser");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readUser);

    const saveSession = useCallback(({ user: account, access_token, refresh_token }) => {
        localStorage.setItem("currentUser", JSON.stringify(account));
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("refreshToken", refresh_token);
        setUser(account);
    }, []);

    const updateUser = useCallback((account) => {
        localStorage.setItem("currentUser", JSON.stringify(account));
        setUser(account);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error("Lỗi đăng xuất:", err);
        } finally {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    }, []);

    const value = {
        user,
        isLogin: !!user,
        isAdmin: user?.role === "ADMIN",
        saveSession,
        updateUser,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
