import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import authService from "../../../services/authService";
import { getErrorMessage } from "../../../services/api";
import "./Profile.css";

function Profile() {
    const toast = useToast();
    const { user, isLogin, updateUser, saveSession } = useAuth();
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const profileForm = useForm({ defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "", address: user?.address ?? "" } });
    const passwordForm = useForm({ defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

    if (!isLogin) return <Navigate to="/login" state={{ from: "/profile" }} replace />;

    const saveProfile = async (data) => {
        setSavingProfile(true);
        try {
            const res = await authService.updateMe(data);
            updateUser(res.data);
            toast.success("Đã lưu thông tin");
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async (data) => {
        setSavingPassword(true);
        setPasswordError("");
        try {
            const res = await authService.changePassword(data.currentPassword, data.newPassword);
            saveSession(res.data);
            passwordForm.reset();
            toast.success("Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.");
        } catch (err) {
            setPasswordError(getErrorMessage(err));
        } finally {
            setSavingPassword(false);
        }
    };

    const pe = passwordForm.formState.errors;

    return (
        <div className="container profile-page">
            <form className="card" onSubmit={profileForm.handleSubmit(saveProfile)}>
                <h2>Thông tin tài khoản</h2>
                <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" value={user.email} disabled />
                </div>
                <div className="form-group">
                    <label>Họ tên</label>
                    <input className="form-control" {...profileForm.register("name", { required: true, minLength: 2 })} />
                </div>
                <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                        className="form-control"
                        {...profileForm.register("phone", { pattern: { value: /^((0|\+84)\d{9,10})?$/, message: "Số điện thoại không hợp lệ" } })}
                    />
                    {profileForm.formState.errors.phone && <p className="error">{profileForm.formState.errors.phone.message}</p>}
                </div>
                <div className="form-group">
                    <label>Địa chỉ</label>
                    <input className="form-control" {...profileForm.register("address")} />
                </div>
                <button className="btn" disabled={savingProfile}>
                    {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
            </form>

            <form className="card" onSubmit={passwordForm.handleSubmit(savePassword)}>
                <h2>Đổi mật khẩu</h2>
                {passwordError && <p className="alert alert-error">{passwordError}</p>}
                <div className="form-group">
                    <label>Mật khẩu hiện tại</label>
                    <input type="password" className="form-control" {...passwordForm.register("currentPassword", { required: "Vui lòng nhập mật khẩu hiện tại" })} />
                    {pe.currentPassword && <p className="error">{pe.currentPassword.message}</p>}
                </div>
                <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <input
                        type="password"
                        className="form-control"
                        {...passwordForm.register("newPassword", {
                            required: "Vui lòng nhập mật khẩu mới",
                            minLength: { value: 8, message: "Tối thiểu 8 ký tự" },
                            validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Phải có cả chữ và số",
                        })}
                    />
                    {pe.newPassword && <p className="error">{pe.newPassword.message}</p>}
                </div>
                <div className="form-group">
                    <label>Nhập lại mật khẩu mới</label>
                    <input
                        type="password"
                        className="form-control"
                        {...passwordForm.register("confirmPassword", {
                            validate: (v) => v === passwordForm.getValues("newPassword") || "Mật khẩu nhập lại không khớp",
                        })}
                    />
                    {pe.confirmPassword && <p className="error">{pe.confirmPassword.message}</p>}
                </div>
                <button className="btn" disabled={savingPassword}>
                    {savingPassword ? "Đang lưu..." : "Đổi mật khẩu"}
                </button>
            </form>
        </div>
    );
}

export default Profile;
