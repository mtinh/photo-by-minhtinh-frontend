# Photos by MinhTinh — Frontend (ReactJS)

Giao diện website studio ảnh: khách xem và đặt **gói chụp / sản phẩm in**, xem **gallery ảnh riêng**; admin quản lý sản phẩm, đơn hàng, người dùng, **thư viện ảnh** (upload, chỉnh sửa, yêu thích, thùng rác) và **album giao khách**.

Backend nằm ở project riêng: `PHOTO-BY-MINHTINH-BACKEND`. Hai project chạy độc lập, chỉ giao tiếp qua REST API.

| | |
|---|---|
| Thư viện | React 19, Vite |
| Điều hướng | react-router-dom |
| Gọi API | axios (`src/services/api.js`, tự gắn token và tự làm mới token) |
| Form | react-hook-form (Đăng ký, form admin) |
| Icon | react-icons |
| CSS | CSS thuần, mỗi component một file `.css`, biến màu trong `src/index.css` (sáng / tối) |

---

## 1. Chạy trên máy

Chạy backend trước (cổng 4310), sau đó:

```bash
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:4310/api/v1
npm run dev               # http://localhost:3000
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy dev server cổng 3000 |
| `npm run build` | Build ra thư mục `dist/` |
| `npm run lint` | Kiểm tra code bằng ESLint |
| `npm run preview` | Xem bản build |

Tài khoản mẫu: Admin `admin@photos.local` / `Admin@123` · Khách `khach@photos.local` / `Khach@123`.

---

## 2. Cấu trúc thư mục

Theo cấu trúc project mẫu của lớp (`module4/my-app-react`): mỗi component là một thư mục gồm `Ten.jsx` + `Ten.css`, chia theo 3 layout.

```
index.html, vite.config.js, eslint.config.js, vercel.json, .env.example
public/                         favicon, avatar
src/
  main.jsx                      Điểm khởi chạy React
  App.jsx                       Khai báo toàn bộ route
  App.css                       Class dùng chung: .btn, .form-*, .table-wrapper, .badge-*, .spinner, toast
  index.css                     Biến màu (sáng/tối), font, reset
  components/
    PhotoStudio/                Layout cho khách (Navbar + nội dung + Footer + ChatBot)
    Auth/                       Layout đăng nhập / đăng ký
    Admin/                      Layout quản trị (Header + Sidebar + nội dung)
  context/                      State dùng chung toàn app
  reducer/                      Reducer cho giỏ hàng và hàng đợi upload
  services/                     Hàm gọi API theo từng nhóm
```

### `src/App.jsx` — các route

| Layout | URL | Component |
|---|---|---|
| `PhotoStudio` | `/` | `PhotoStudio/Home` |
| | `/about` | `PhotoStudio/About` |
| | `/category/:slug` | `PhotoStudio/CategoryProduct` |
| | `/products` | `PhotoStudio/ProductList` |
| | `/products/:slug` | `PhotoStudio/ProductDetail` |
| | `/cart`, `/checkout` | `PhotoStudio/Cart`, `PhotoStudio/Checkout` |
| | `/orders`, `/orders/:code` | `PhotoStudio/Orders`, `PhotoStudio/OrderDetail` |
| | `/my-photos` | `PhotoStudio/MyPhotos` |
| | `/profile` | `PhotoStudio/Profile` |
| | `*` | `PhotoStudio/NotFound` |
| `Auth` | `/login`, `/register` | `Auth/Login`, `Auth/Register` |
| | `/forgot-password`, `/reset-password` | `Auth/ForgotPassword`, `Auth/ResetPassword` |
| `Admin` | `/dashboard` | `Admin/Dashboard` |
| | `/list-product`, `/insert-product`, `/detail-product/:id/edit` | `Admin/ListProduct`, `Admin/DetailProductEdit` |
| | `/list-category` | `Admin/ListCategory` |
| | `/list-order`, `/detail-order/:id` | `Admin/ListOrder`, `Admin/DetailOrder` |
| | `/users` | `Admin/ListUsers` |
| | `/photos`, `/photos/favorites`, `/photos/trash`, `/photos/search` | `Admin/Photos` (prop `filter`) |
| | `/list-album`, `/detail-album/:id` | `Admin/ListAlbum`, `Admin/DetailAlbum` |
| Không layout | `/g/:slug` | `PhotoStudio/Gallery` (gallery của khách) |

### `src/components/PhotoStudio/` — trang khách

| File | Vai trò |
|---|---|
| `PhotoStudio.jsx` | Layout: `Navbar` + `<Outlet />` + `Footer` + `ChatBot` |
| `Navbar/Navbar.jsx` | Menu, danh mục, ô tìm kiếm, số lượng giỏ hàng, nút sáng/tối, menu tài khoản |
| `Footer/Footer.jsx` | Chân trang |
| `Home/Home.jsx` | Trang chủ: banner, danh mục, sản phẩm nổi bật |
| `About/About.jsx` | Giới thiệu studio |
| `CategoryProduct/CategoryProduct.jsx` | Sản phẩm theo danh mục (phân trang) |
| `ProductList/ProductList.jsx` | Tất cả sản phẩm: tìm kiếm, lọc loại, sắp xếp, phân trang |
| `ProductCard/ProductCard.jsx` | Thẻ sản phẩm; xuất thêm `ProductImage`, `StockBadge` |
| `ProductDetail/ProductDetail.jsx` | Chi tiết sản phẩm, chọn số lượng, thêm giỏ, sản phẩm liên quan |
| `Cart/Cart.jsx` | Giỏ hàng: sửa số lượng, xoá; xuất `CartSummary` (tạm tính, phí ship) |
| `Checkout/Checkout.jsx` | Thông tin nhận hàng, ngày chụp mong muốn, đặt hàng |
| `Orders/Orders.jsx` | Lịch sử đơn hàng; xuất `OrderStatusBadge` |
| `OrderDetail/OrderDetail.jsx` | Chi tiết đơn, lịch sử trạng thái, huỷ đơn; xuất `OrderInfo` |
| `MyPhotos/MyPhotos.jsx` | Danh sách gallery studio đã giao cho tài khoản này |
| `Profile/Profile.jsx` | Sửa thông tin cá nhân, đổi mật khẩu |
| `Gallery/Gallery.jsx` | Gallery khách `/g/:slug`: màn hình nhập mật khẩu, nhập PIN để tải ảnh gốc, thả tim ảnh, tải ZIP |
| `ChatBot/ChatBot.jsx` | Khung chat AI góc phải, nhận câu trả lời dạng stream |
| `PhotoGrid/PhotoGrid.jsx` | Lưới ảnh dàn đều theo hàng (giống Google Photos), nhóm theo ngày, chọn nhiều ảnh, tải thêm khi cuộn |
| `PhotoViewer/PhotoViewer.jsx` | Xem ảnh toàn màn hình: phím ←/→/Esc/Z, vuốt trên điện thoại, phóng 100% ảnh gốc |
| `Modal/Modal.jsx` | Hộp thoại dùng chung (đóng bằng Esc, khoá cuộn trang) |
| `Pagination/Pagination.jsx` | Phân trang dùng chung, nhận prop `meta` (`page`, `limit`, `total`, `totalPages`) do API trả về |
| `NotFound/NotFound.jsx` | Trang 404 |

### `src/components/Auth/`

| File | Vai trò |
|---|---|
| `Auth.jsx` | Layout 2 cột cho các trang đăng nhập |
| `Login/Login.jsx` | Đăng nhập; admin chuyển về `/dashboard`, khách về trang trước đó |
| `Register/Register.jsx` | Đăng ký, kiểm tra dữ liệu bằng react-hook-form, hiện lỗi từng trường do server trả về |
| `ForgotPassword/ForgotPassword.jsx` | Nhập email để nhận link đặt lại mật khẩu |
| `ResetPassword/ResetPassword.jsx` | Đặt mật khẩu mới từ link `?token=...` |

### `src/components/Admin/`

| File | Vai trò |
|---|---|
| `Admin.jsx` | Layout quản trị; chặn người chưa đăng nhập hoặc không phải ADMIN |
| `Header/Header.jsx` | Thanh trên: nút mở menu (điện thoại), thông báo đơn chờ xử lý, sáng/tối, tài khoản |
| `Sidebar/Sidebar.jsx` | Menu trái, thanh dung lượng lưu trữ |
| `Dashboard/Dashboard.jsx` | Thẻ số liệu, biểu đồ doanh thu, đơn theo trạng thái, top sản phẩm, đơn mới |
| `RevenueChart/RevenueChart.jsx` | Biểu đồ cột doanh thu vẽ bằng SVG, có tooltip và bảng số liệu |
| `ListProduct/ListProduct.jsx` | Danh sách sản phẩm: tìm, lọc, phân trang, xoá |
| `DetailProductEdit/DetailProductEdit.jsx` | Form thêm / sửa sản phẩm, upload ảnh |
| `ListCategory/ListCategory.jsx` | Danh mục: thêm/sửa trong modal, xoá |
| `ListOrder/ListOrder.jsx` | Đơn hàng: tìm, lọc trạng thái, phân trang |
| `DetailOrder/DetailOrder.jsx` | Chi tiết đơn, đổi trạng thái theo luồng cho phép, gắn gallery cho đơn |
| `ListUsers/ListUsers.jsx` | Người dùng: tạo, sửa, khoá/mở khoá, xoá |
| `Photos/Photos.jsx` | Thư viện ảnh: upload (chọn file hoặc kéo thả), yêu thích, xoá vào thùng rác, khôi phục, thêm vào album, tìm kiếm, bảng thông tin EXIF |
| `PhotoEditor/PhotoEditor.jsx` | Chỉnh ảnh: cắt, xoay, lật, độ sáng/tương phản/bão hoà/nhiệt độ; xem trước ở trình duyệt, lưu xử lý trên ảnh gốc ở server |
| `UploadPanel/UploadPanel.jsx` | Khung tiến trình upload góc dưới: % từng ảnh, huỷ, thử lại |
| `ListAlbum/ListAlbum.jsx` | Danh sách album |
| `DetailAlbum/DetailAlbum.jsx` | Ảnh trong album, tab "Khách đã chọn" |
| `GalleryShare/GalleryShare.jsx` | Cài đặt gallery giao khách: link, mật khẩu xem, PIN tải, hạn dùng, gắn tài khoản khách |

### `src/context/` và `src/reducer/`

| File | Vai trò |
|---|---|
| `context/ThemeContext.jsx` | Chế độ sáng/tối, lưu vào localStorage (`useTheme`) |
| `context/AuthContext.jsx` | Người dùng đang đăng nhập, `saveSession`, `updateUser`, `logout` (`useAuth`) |
| `context/CartContext.jsx` | Giỏ hàng đồng bộ với server, dùng `cartReducer` (`useCart`) |
| `context/ToastContext.jsx` | Thông báo nhỏ góc màn hình (`useToast`) |
| `context/UploadContext.jsx` | Hàng đợi upload, tối đa 3 ảnh cùng lúc, dùng `uploadReducer` (`useUpload`) |
| `reducer/cartReducer.jsx` | `SET_CART`, `UPDATE_QUANTITY`, `CLEAR_CART` |
| `reducer/uploadReducer.jsx` | Thêm ảnh, cập nhật %, xong, lỗi, huỷ, thử lại, xoá ảnh đã xong |

### `src/services/`

| File | Vai trò |
|---|---|
| `api.js` | axios instance: gắn `Authorization: Bearer`, gặp 401 thì gọi `/refresh-token` rồi gửi lại request; `getErrorMessage` (lấy `message` lỗi), `getFieldErrors` (đổi `errors: [{ field, message }]` thành `{ field: message }` để gắn vào form) |
| `authService.js` | Đăng ký, đăng nhập, đăng xuất, quên/đặt lại mật khẩu, hồ sơ |
| `productService.js`, `categoryService.js` | Sản phẩm, danh mục (khách + admin) |
| `cartService.js`, `orderService.js` | Giỏ hàng, đơn hàng, thống kê, gallery của tôi |
| `userService.js` | Quản lý người dùng |
| `mediaService.js` | Thư viện ảnh, upload có tiến trình |
| `albumService.js` | Album, cài đặt gallery, ảnh khách chọn |
| `galleryService.js` | Gallery khách; token gallery lưu localStorage `gallery_<slug>`, gửi qua header `X-Gallery-Token` |
| `chatService.js` | Gửi tin nhắn chatbot, đọc stream Server-Sent Events bằng `fetch` |
| `format.js` | Định dạng tiền VND, ngày giờ, dung lượng; nhãn trạng thái đơn; nhãn tồn kho |

---

## 3. Đối chiếu yêu cầu đồ án (phần giao diện)

| Yêu cầu | Xem code |
|---|---|
| Đăng ký, đăng nhập, đăng xuất, quên mật khẩu | `components/Auth/*`, `services/authService.js`, `context/AuthContext.jsx` |
| Danh sách, tìm kiếm, phân trang sản phẩm | `PhotoStudio/ProductList`, `PhotoStudio/CategoryProduct`, `PhotoStudio/Pagination` |
| Chi tiết sản phẩm | `PhotoStudio/ProductDetail` |
| Giỏ hàng, đặt hàng, lịch sử đơn | `PhotoStudio/Cart`, `PhotoStudio/Checkout`, `PhotoStudio/Orders`, `PhotoStudio/OrderDetail`, `context/CartContext.jsx` |
| Admin: danh mục, sản phẩm, người dùng, đơn hàng | `Admin/ListCategory`, `Admin/ListProduct`, `Admin/DetailProductEdit`, `Admin/ListUsers`, `Admin/ListOrder`, `Admin/DetailOrder` |
| Thống kê doanh thu, biểu đồ | `Admin/Dashboard`, `Admin/RevenueChart` |
| Phân quyền | `Admin/Admin.jsx` (chặn không phải ADMIN), `services/api.js` (token) |
| Chatbot AI | `PhotoStudio/ChatBot`, `services/chatService.js` |
| Báo lỗi khi tồn kho = 0 / sản phẩm ngừng bán | `services/format.js` → `isPurchasable` (khoá nút thêm giỏ ở `ProductDetail`), `stockLabel` (nhãn "Hết hàng"/"Ngừng bán" ở `ProductCard`); lỗi từ server hiện qua toast |
| Đơn Hoàn thành / Đã huỷ không sửa được | `services/format.js` → `ORDER_TRANSITIONS`, `Admin/DetailOrder` |
| Responsive, sáng/tối | `index.css` (biến màu), `Admin/Sidebar` (menu trượt trên điện thoại) |

---

## 4. Deploy lên Vercel

1. Vercel → **Add New Project** → chọn repo frontend. Framework: *Vite*.
2. Environment Variables: `VITE_API_URL` = `https://<backend>.onrender.com/api/v1`.
3. Deploy. File `vercel.json` chuyển mọi URL về `index.html` để F5 ở `/products/...` không bị 404.
4. Quay lại Render, đặt `CLIENT_URL` của backend = URL Vercel vừa có.
