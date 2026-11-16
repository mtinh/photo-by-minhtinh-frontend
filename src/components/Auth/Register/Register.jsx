import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { getFieldErrors } from "../../../services/api";
import authService from "../../../services/authService";
import { useAuth } from "../../../context/AuthContext";
import "./Register.css";

function Register() {
    const navigate = useNavigate();
    const { saveSession } = useAuth();
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isValid },
    } = useForm({
        mode: "onChange",
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError("");

        try {
            const res = await authService.register({
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.password,
            });

            if (res.success) {
                saveSession(res.data);
                navigate("/");
            }
        } catch (err) {
            Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
            if (err.response?.status === 409) setError("email", { message: err.response.data.message });
            setServerError(err.response?.data?.message || "Đăng ký thất bại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="auth-card register">
                <h2>Đăng ký</h2>
                <p className="subtitle">Đặt lịch chụp, theo dõi đơn hàng và nhận ảnh gốc</p>

                {serverError && <p className="alert alert-error">{serverError}</p>}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <input
                        type="text"
                        placeholder="Họ và tên"
                        {...register("name", {
                            required: "Vui lòng nhập họ tên.",
                            minLength: { value: 2, message: "Họ tên phải có ít nhất 2 ký tự." },
                        })}
                    />
                    {errors.name && <p className="error">{errors.name.message}</p>}

                    <input
                        type="email"
                        placeholder="Email"
                        {...register("email", {
                            required: "Vui lòng nhập email.",
                            pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ." },
                        })}
                    />
                    {errors.email && <p className="error">{errors.email.message}</p>}

                    <input
                        type="text"
                        placeholder="Số điện thoại (tuỳ chọn)"
                        {...register("phone", {
                            pattern: { value: /^(0|\+84)\d{9,10}$/, message: "Số điện thoại không hợp lệ." },
                        })}
                    />
                    {errors.phone && <p className="error">{errors.phone.message}</p>}

                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        {...register("password", {
                            required: "Vui lòng nhập mật khẩu.",
                            minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự." },
                            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Mật khẩu phải có cả chữ và số.",
                        })}
                    />
                    {errors.password && <p className="error">{errors.password.message}</p>}
                    {!errors.password && watch("password") && <p className="success">Mật khẩu hợp lệ.</p>}

                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        {...register("confirmPassword", {
                            required: "Vui lòng nhập lại mật khẩu.",
                            validate: (v) => v === watch("password") || "Mật khẩu nhập lại không khớp.",
                        })}
                    />
                    {errors.confirmPassword && <p className="error">{errors.confirmPassword.message}</p>}

                    <button type="submit" disabled={!isValid || loading}>
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                <p className="auth-links">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
