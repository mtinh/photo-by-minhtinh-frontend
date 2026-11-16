import { Link } from "react-router-dom";
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import "./Footer.css";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div>
                    <h4>Photos by MinhTinh</h4>
                    <p>Studio chụp ảnh cưới, kỷ yếu, gia đình. Giao ảnh gốc chất lượng cao qua gallery riêng cho từng khách.</p>
                </div>
                <div>
                    <h4>Liên hệ</h4>
                    <p><FaPhoneAlt /> 0900 000 001</p>
                    <p><FaEnvelope /> hello@photos.local</p>
                    <p><FaMapMarkerAlt /> TP. Hồ Chí Minh</p>
                </div>
                <div>
                    <h4>Chính sách</h4>
                    <p>Dời lịch miễn phí 1 lần (báo trước 3 ngày)</p>
                    <p>Đổi mới sản phẩm in lỗi trong 7 ngày</p>
                    <p><Link to="/about">Về chúng tôi</Link></p>
                </div>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} Photos by MinhTinh</p>
        </footer>
    );
}

export default Footer;
