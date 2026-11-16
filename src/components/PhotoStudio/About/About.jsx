import { Link } from "react-router-dom";
import {
    FaCamera,
    FaLock,
    FaDownload,
    FaHeart,
    FaArrowRight
} from "react-icons/fa";
import "./About.css";

const stats = [
    { id: 1, number: "1,200+", label: "Buổi chụp đã thực hiện" },
    { id: 2, number: "350,000+", label: "Ảnh gốc đã giao" },
    { id: 3, number: "99.8%", label: "Khách hài lòng" },
    { id: 4, number: "7–14 ngày", label: "Thời gian giao ảnh" },
];

const coreValues = [
    {
        id: 1,
        icon: <FaCamera className="value-icon" />,
        title: "Ekip Chuyên Nghiệp",
        description: "Photographer nhiều năm kinh nghiệm, hỗ trợ tạo dáng, ánh sáng và concept cho từng buổi chụp.",
    },
    {
        id: 2,
        icon: <FaLock className="value-icon" />,
        title: "Gallery Riêng Tư",
        description: "Mỗi khách hàng một gallery riêng, có mật khẩu xem và mã PIN tải ảnh — chỉ bạn thấy ảnh của bạn.",
    },
    {
        id: 3,
        icon: <FaDownload className="value-icon" />,
        title: "Ảnh Gốc 100%",
        description: "Không nén, không giảm độ phân giải. Tải từng ảnh hoặc cả bộ ảnh dạng ZIP chỉ với một cú nhấp.",
    },
    {
        id: 4,
        icon: <FaHeart className="value-icon" />,
        title: "Chọn Ảnh Yêu Thích",
        description: "Thả tim những ảnh bạn thích ngay trong gallery để studio retouch đúng ý bạn.",
    },
];

const teamMembers = [
    {
        id: 1,
        name: "Dương Minh Tình",
        role: "Founder & Photographer",
        avatar: "/asset/img/avatar/avatar-circle.png",
        bio: "Chụp ảnh cưới, kỷ yếu và gia đình; phụ trách concept và hậu kỳ màu.",
    },
    {
        id: 2,
        name: "Trần Thị Lan",
        role: "Retoucher",
        avatar: "/asset/img/avatar/avatar-circle.png",
        bio: "Chỉnh sửa chân dung tự nhiên, giữ trọn chi tiết và màu da chuẩn.",
    },
    {
        id: 3,
        name: "Lê Minh Tuấn",
        role: "Chăm sóc khách hàng",
        avatar: "/asset/img/avatar/avatar-circle.png",
        bio: "Tư vấn gói chụp, sắp xếp lịch và hỗ trợ khách nhận ảnh.",
    },
];

function About() {
    return (
        <div className="about-page">
            <section className="about-hero">
                <div className="about-container">
                    <span className="badge-pill">VỀ CHÚNG TÔI</span>
                    <h1 className="hero-title">
                        Lưu Giữ Khoảnh Khắc <span className="highlight-text">Trọn Vẹn Từng Điểm Ảnh</span>
                    </h1>
                    <p className="hero-subtitle">
                        Photos by MinhTinh là studio chụp ảnh cưới, kỷ yếu, gia đình và in ấn ảnh cao cấp,
                        giao ảnh gốc chất lượng cao qua gallery riêng cho từng khách hàng.
                    </p>
                </div>
            </section>

            <section className="about-stats">
                <div className="about-container stats-grid">
                    {stats.map((item) => (
                        <div key={item.id} className="stat-card">
                            <h3 className="stat-number">{item.number}</h3>
                            <p className="stat-label">{item.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-values">
                <div className="about-container">
                    <div className="section-header">
                        <h2 className="section-title">Tại Sao Nên Chọn Chúng Tôi?</h2>
                        <p className="section-desc">
                            Chất lượng ảnh và sự riêng tư của bạn là ưu tiên hàng đầu của studio.
                        </p>
                    </div>

                    <div className="values-grid">
                        {coreValues.map((val) => (
                            <div key={val.id} className="value-card">
                                <div className="icon-wrapper">{val.icon}</div>
                                <h4>{val.title}</h4>
                                <p>{val.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="about-team">
                <div className="about-container">
                    <div className="section-header">
                        <h2 className="section-title">Đội Ngũ Đồng Hành</h2>
                        <p className="section-desc">
                            Những con người luôn cống hiến hết mình cho từng khung hình của bạn.
                        </p>
                    </div>

                    <div className="team-grid">
                        {teamMembers.map((member) => (
                            <div key={member.id} className="team-card">
                                <img src={member.avatar} alt={member.name} className="team-avatar" />
                                <h4 className="member-name">{member.name}</h4>
                                <span className="member-role">{member.role}</span>
                                <p className="member-bio">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="about-cta">
                <div className="about-container cta-card">
                    <h2>Sẵn Sàng Cho Buổi Chụp Của Bạn?</h2>
                    <p>Khám phá các gói chụp và sản phẩm in ảnh cao cấp của studio.</p>
                    <Link to="/products" className="cta-button">
                        Xem gói chụp <FaArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default About;
