import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaEdit, FaLock, FaLockOpen, FaPlus, FaTrash } from "react-icons/fa";
import userService from "../../../services/userService";
import { getErrorMessage, getFieldErrors } from "../../../services/api";
import { formatDate } from "../../../services/format";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import Modal from "../../PhotoStudio/Modal/Modal";
import Pagination from "../../PhotoStudio/Pagination/Pagination";
import "./ListUsers.css";

const ITEMS_PER_PAGE = 10;

function UserForm({ user, onClose, onSaved }) {
    const toast = useToast();
    const [serverError, setServerError] = useState("");
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
            address: user?.address ?? "",
            password: "",
            role: user?.role ?? "CUSTOMER",
        },
    });

    const onSubmit = async (data) => {
        setServerError("");
        try {
            if (user) {
                await userService.updateUser(user.id, { name: data.name, phone: data.phone, address: data.address, role: data.role });
            } else {
                await userService.createUser({ name: data.name, email: data.email, phone: data.phone, password: data.password, role: data.role });
            }
            toast.success(user ? "Đã cập nhật người dùng" : "Đã tạo người dùng");
            onSaved();
        } catch (err) {
            Object.entries(getFieldErrors(err)).forEach(([field, message]) => setError(field, { message }));
            setServerError(getErrorMessage(err));
        }
    };

    return (
        <Modal open title={user ? "Cập nhật người dùng" : "Tạo người dùng"} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {serverError && <p className="alert alert-error">{serverError}</p>}
                <div className="form-group">
                    <label>Họ tên</label>
                    <input className="form-control" {...register("name", { required: "Vui lòng nhập họ tên" })} />
                    {errors.name && <p className="error">{errors.name.message}</p>}
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        className="form-control"
                        type="email"
                        disabled={!!user}
                        {...register("email", { required: "Vui lòng nhập email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ" } })}
                    />
                    {errors.email && <p className="error">{errors.email.message}</p>}
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Số điện thoại</label>
                        <input className="form-control" {...register("phone", { pattern: { value: /^((0|\+84)\d{9,10})?$/, message: "Số điện thoại không hợp lệ" } })} />
                        {errors.phone && <p className="error">{errors.phone.message}</p>}
                    </div>
                    <div className="form-group">
                        <label>Vai trò</label>
                        <select className="form-control" {...register("role")}>
                            <option value="CUSTOMER">Khách hàng</option>
                            <option value="ADMIN">Quản trị viên</option>
                        </select>
                    </div>
                </div>
                {user ? (
                    <div className="form-group">
                        <label>Địa chỉ</label>
                        <input className="form-control" {...register("address")} />
                    </div>
                ) : (
                    <div className="form-group">
                        <label>Mật khẩu tạm</label>
                        <input className="form-control" {...register("password", { required: "Vui lòng nhập mật khẩu", minLength: { value: 8, message: "Tối thiểu 8 ký tự" } })} />
                        {errors.password && <p className="error">{errors.password.message}</p>}
                    </div>
                )}
                <div className="list-users-form-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Huỷ
                    </button>
                    <button type="submit" className="btn" disabled={isSubmitting}>
                        {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

const ListUsers = () => {
    const toast = useToast();
    const { user: me } = useAuth();

    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editing, setEditing] = useState(undefined);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchKeyword(keyword.trim());
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [keyword]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await userService.getUsers({
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    q: searchKeyword || undefined,
                    role: filterRole || undefined,
                    status: filterStatus || undefined,
                });
                if (res.success && res.data) {
                    setUsers(res.data);
                    setMeta(res.meta);
                }
            } catch (err) {
                setError(getErrorMessage(err, "Không thể tải danh sách người dùng."));
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentPage, searchKeyword, filterRole, filterStatus, reload]);

    const toggleLock = async (user) => {
        const lock = user.status === "ACTIVE";
        if (lock && !window.confirm(`Khoá tài khoản ${user.email}? Người dùng sẽ bị đăng xuất ngay.`)) return;
        try {
            await userService.updateUser(user.id, { status: lock ? "LOCKED" : "ACTIVE" });
            toast.success(lock ? "Đã khoá tài khoản" : "Đã mở khoá tài khoản");
            setReload((r) => r + 1);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Xoá tài khoản ${user.email}?\nTài khoản bị vô hiệu hoá, lịch sử đơn hàng vẫn được giữ.`)) return;
        try {
            await userService.deleteUser(user.id);
            toast.success("Đã xoá người dùng");
            setReload((r) => r + 1);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="list-product">
            <div className="page-header">
                <h2>Quản lý người dùng</h2>
                <button className="btn" onClick={() => setEditing(null)}>
                    <FaPlus /> Tạo người dùng
                </button>
            </div>

            <div className="filter-product">
                <input type="search" placeholder="Tìm theo tên, email, số điện thoại..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />

                <select
                    value={filterRole}
                    onChange={(e) => {
                        setFilterRole(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="ADMIN">Quản trị viên</option>
                    <option value="CUSTOMER">Khách hàng</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="LOCKED">Đã khoá</option>
                </select>
            </div>

            {error ? (
                <div className="state-box">{error}</div>
            ) : (
                <div className={`table-wrapper ${loading ? "is-loading" : ""}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Họ và tên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Vai trò</th>
                                <th>Đơn</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => {
                                    const isMe = user.id === me?.id;
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <strong>{user.name}</strong> {isMe && <small className="text-muted">(bạn)</small>}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || "Chưa cập nhật"}</td>
                                            <td>
                                                <span className={`badge ${user.role === "ADMIN" ? "badge-danger" : "badge-primary"}`}>{user.role}</span>
                                            </td>
                                            <td>{user.orderCount}</td>
                                            <td>
                                                <span className={`badge ${user.status === "ACTIVE" ? "badge-success" : "badge-warning"}`}>
                                                    {user.status === "ACTIVE" ? "Hoạt động" : "Đã khoá"}
                                                </span>
                                            </td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="icon-btn" title="Cập nhật" onClick={() => setEditing(user)}>
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="icon-btn"
                                                        title={user.status === "ACTIVE" ? "Khoá" : "Mở khoá"}
                                                        disabled={isMe}
                                                        onClick={() => toggleLock(user)}
                                                    >
                                                        {user.status === "ACTIVE" ? <FaLock /> : <FaLockOpen />}
                                                    </button>
                                                    <button className="icon-btn" title="Xoá" disabled={isMe} onClick={() => handleDelete(user)}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">
                                        {loading ? "Đang tải..." : "Không tìm thấy người dùng nào"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination meta={meta} onChange={setCurrentPage} />

            {editing !== undefined && (
                <UserForm
                    user={editing}
                    onClose={() => setEditing(undefined)}
                    onSaved={() => {
                        setEditing(undefined);
                        setReload((r) => r + 1);
                    }}
                />
            )}
        </div>
    );
};

export default ListUsers;
