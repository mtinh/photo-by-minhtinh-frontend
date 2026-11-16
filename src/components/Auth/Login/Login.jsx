import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const [params] = useSearchParams();
    const { saveSession } = useAuth();

    const isValidEmail = /^\S+@\S+\.\S+$/.test(email);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!isValidEmail || password.length === 0) {
            return;
        }

        setLoading(true);

        try {
            const res = await authService.login(email, password);

            if (res.success && res.data) {
                saveSession(res.data);

                const from = location.state?.from;
                if (from) navigate(from, { replace: true });
                else navigate(res.data.user.role === "ADMIN" ? "/dashboard" : "/", { replace: true });
            }
        } catch (error) {
            setError(error.response?.data?.message || "Email hoặc mật khẩu không đúng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="auth-card login" onSubmit={handleLogin} noValidate>
                <h2>Đăng nhập</h2>
                <p className="subtitle">Chào mừng bạn quay lại</p>

                {params.get("reset") && <p className="alert alert-success">Đặt lại mật khẩu thành công, hãy đăng nhập.</p>}

                <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                    }}
                />

                {email.length > 0 && !isValidEmail && <p className="error">Email không hợp lệ.</p>}

                <input
                    type="password"
                    placeholder="Mật khẩu"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                    }}
                />

                {error && <p className="error">{error}</p>}

                <p className="mt-10 login-forgot">
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                </p>

                <button type="submit" disabled={!isValidEmail || password.length === 0 || loading}>
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                <p className="auth-links">
                    Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                </p>

                <div className="demo-account">
                    Admin: admin@photos.local / Admin@123
                    <br />
                    Khách: khach@photos.local / Khach@123
                </div>
            </form>
        </div>
    );
}

export default Login;
