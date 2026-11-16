import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authService from "../../../services/authService";
import "./ResetPassword.css";

function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token") ?? "";
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ mode: "onChange" });

    const onSubmit = async (data) => {
        setLoading(true);
        setErrorMessage("");
        try {
            const res = await authService.resetPassword(token, data.password);
            if (res.success) navigate("/login?reset=1", { replace: true });
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Không đặt lại được mật khẩu.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="reset-password">
                <div className="auth-card">
                    <h2>Liên kết không hợp lệ</h2>
                    <p className="auth-links">
                        <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password">
            <div className="auth-card">
                <h2>Đặt lại mật khẩu</h2>
                <p className="subtitle">Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.</p>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <input
                        type="password"
                        placeholder="Mật khẩu mới"
                        {...register("password", {
                            required: "Vui lòng nhập mật khẩu mới.",
                            minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
                            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Mật khẩu phải có cả chữ và số.",
                        })}
                    />
                    {errors.password && <p className="error">{errors.password.message}</p>}

                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        {...register("confirmPassword", {
                            validate: (v) => v === watch("password") || "Mật khẩu nhập lại không khớp.",
                        })}
                    />
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword.message}</p>}

                    {errorMessage && <p className="error">{errorMessage}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
