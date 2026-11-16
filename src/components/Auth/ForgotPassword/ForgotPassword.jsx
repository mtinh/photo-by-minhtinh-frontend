import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import authService from "../../../services/authService";
import "./ForgotPassword.css";

function ForgotPassword() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const onSubmit = async (data) => {
        setLoading(true);
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const res = await authService.forgotPassword(data.email);

            if (res.success) {
                setSuccessMessage(res.message || "Kiểm tra email để đặt lại mật khẩu.");
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password">
            <div className="auth-card">
                <h2>Quên mật khẩu</h2>
                <p className="subtitle">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút).</p>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <input
                        {...register("email", {
                            required: "Email không được để trống",
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: "Định dạng Email không hợp lệ",
                            },
                        })}
                        type="email"
                        placeholder="Email"
                    />

                    {errors?.email && <p className="error">{errors.email.message}</p>}

                    {errorMessage && <p className="error">{errorMessage}</p>}

                    {successMessage && <p className="alert alert-success mt-10">{successMessage}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Gửi liên kết"}
                    </button>
                </form>

                <p className="auth-links">
                    <Link to="/login">Quay lại đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
