import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
    return (
        <div className="not-found">
            <h1>404</h1>
            <p>Không tìm thấy trang bạn yêu cầu.</p>
            <Link to="/" className="btn">
                Về trang chủ
            </Link>
        </div>
    );
}

export default NotFound;
