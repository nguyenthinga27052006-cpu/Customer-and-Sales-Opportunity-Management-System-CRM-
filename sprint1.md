# WALKTHROUGH: HOÀN THÀNH TRIỂN KHAI SPRINT 1 (FOUNDATION & CATALOG)

Chúng tôi đã hoàn thành toàn bộ các hạng mục công việc của **Sprint 1** bao gồm **EP-01 (Tài khoản & Phân quyền)** và **EP-02 (Danh mục & Cấu hình)**, tuân thủ đúng quy trình **Database → Backend → API Contract → Frontend → Integration → Test**.

---

## 1. Kết quả Triển khai Kỹ thuật

### 1.1. Tầng Cơ sở dữ liệu (Database - PostgreSQL 17)
* **Database Name:** `crm_db`
* **Prisma Schema:** Định nghĩa 15 bảng thực thể chuẩn hóa với quan hệ chặt chẽ, ràng buộc khóa chính/khóa ngoại, chỉ mục, audit timestamps:
  * `vai_tro`, `quyen_han`, `vai_tro_quyen_han`: RBAC phân quyền 7 vai trò chuẩn.
  * `khu_vuc`, `nhom_kinh_doanh`: Cây tổ chức phòng ban phân cấp (`nhom_cha_id`), liên kết khu vực và trưởng nhóm.
  * `nguoi_dung`, `nguoi_dung_vai_tro`, `phien_dang_nhap`, `dat_lai_mat_khau`: Quản lý tài khoản, mã hóa mật khẩu bcrypt, quản lý phiên đăng nhập và token thu hồi an toàn.
  * `san_pham`: Bảng giá niêm yết, giá sàn duyệt chiết khấu, giá vốn bảo mật.
  * `giai_doan_pipeline`, `ly_do_thang_thua`, `doi_thu`: Chuỗi giai đoạn pipeline có xác suất thắng, điều kiện rời giai đoạn, lý do thắng/thua và đối thủ cạnh tranh.
  * `danh_muc_dung_chung`: Ngành nghề, quy mô doanh nghiệp, nguồn lead, loại hoạt động.
  * `nhat_ky_he_thong`: Ghi vết mọi thay đổi dữ liệu nhạy cảm kèm giá trị trước/sau.
* **Seed Script (`prisma/seed.ts`):** Đã nạp thành công 7 vai trò, 10 tài khoản người dùng mẫu, cây tổ chức 3 cấp, 5 sản phẩm, 6 giai đoạn pipeline, đầy đủ danh mục dùng chung.

### 1.2. Tầng Backend (NestJS 10 + TypeScript)
* **Cấu trúc Module:**
  * `AuthModule`: Đăng nhập, chống brute-force (khóa 15 phút sau 5 lần sai), JWT Access/Refresh token pair, thu hồi session khi logout, đổi mật khẩu (thu hồi phiên khác), quên/đặt lại mật khẩu.
  * `NguoiDungModule`: CRUD người dùng, phân trang (mặc định 20 dòng), tìm kiếm, gán nhiều vai trò, ràng buộc trưởng nhóm phải thuộc nhóm, chống tự thu hồi quyền Admin, khóa tài khoản kèm bàn giao dữ liệu bắt buộc.
  * `NhomKinhDoanhModule`: Quản lý cây phân cấp tổ chức, khu vực địa lý, chỉ định trưởng nhóm.
  * `SanPhamModule`: Quản lý danh mục & bảng giá. **Đặc biệt: Giá vốn (`giaVon`) được bảo vệ nghiêm ngặt tại Backend Query**, chỉ trả về cho vai trò `DIRECTOR` hoặc `ADMIN`.
  * `GiaiDoanModule`: Quản lý pipeline, tỷ lệ % xác suất thắng, điều kiện rời giai đoạn, lý do thắng/thua, đối thủ cạnh tranh.
  * `DanhMucModule`: Quản lý các danh mục dùng chung.
  * `AuditLogModule`: Tra cứu lịch sử thay đổi dữ liệu nhạy cảm kèm bộ lọc đa chiều.
* **Swagger API Documentation:** Đang chạy tại `http://localhost:3000/api/docs`.
* **API Prefix:** `http://localhost:3000/api`

### 1.3. Tầng Frontend (React 18 + TypeScript + TailwindCSS + Lucide Icons)
* **Design System & Layout:** Giao diện chuyên nghiệp, responsive từ màn hình di động 360px đến desktop, sidebar thu gọn theo vai trò người dùng, header hiển thị vai trò và nhóm kinh doanh.
* **State Management:** `AuthContext` quản lý phiên đăng nhập, tự động refresh token ngầm khi access token hết hạn, cung cấp các hàm kiểm tra quyền `hasRole`, `hasAnyRole`, `isDirectorOrAdmin`.
* **Màn hình đã hoàn thiện:**
  1. `LoginPage`: Đăng nhập, thông báo lỗi bảo mật chung, hiển thị đếm khóa tài khoản nếu nhập sai nhiều lần, modal quên mật khẩu, các nút đăng nhập nhanh cho môi trường demo.
  2. `ResetPasswordPage`: Đặt lại mật khẩu mới bằng mã token.
  3. `ProfilePage`: Xem và cập nhật hồ sơ cá nhân (họ tên, SĐT Việt Nam hợp lệ, chữ ký email), form đổi mật khẩu chủ động.
  4. `UsersPage`: Bảng danh sách 20 dòng/trang, tìm kiếm theo tên/email/SĐT, lọc theo vai trò/trạng thái/nhóm, modal tạo tài khoản (gán nhiều vai trò), modal chỉnh sửa, modal khóa tài khoản & bắt buộc chọn người tiếp nhận bàn giao.
  5. `OrganizationPage`: Hiển thị trực quan cây sơ đồ tổ chức phòng ban kinh doanh, khu vực địa lý, trưởng nhóm, thành viên trực thuộc, modal thêm nhóm và thêm khu vực.
  6. `ProductsPage`: Danh mục sản phẩm & bảng giá niêm yết, hiển thị giá niêm yết, giá sàn; hiển thị cột **Giá vốn (Bảo mật)** chỉ dành riêng cho `DIRECTOR`/`ADMIN`.
  7. `PipelineConfigPage`: 3 tab quản lý Giai đoạn Pipeline, Lý do Thắng/Thua và Đối thủ cạnh tranh.
  8. `GeneralSettingsPage`: Quản lý danh mục dùng chung (Ngành nghề, Quy mô, Nguồn lead, Hoạt động).
  9. `AuditLogPage`: Bảng theo dõi lịch sử thao tác dữ liệu nhạy cảm kèm modal so sánh chi tiết giá trị trước và sau khi sửa.
  10. `Error403Page` & `Error404Page`: Trang báo lỗi đồng bộ nhận diện thương hiệu kèm nút quay lại luồng làm việc.

---

## 2. Kết quả Kiểm thử Tự động (Automated Verification)

Đã chạy kiểm thử tự động toàn diện qua file `backend/test/sprint1_verification.ts`:

```text
=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG SPRINT 1 ===

[TEST GROUP 1] Xác thực & Đăng nhập:
  ✓ PASS: Trả về JWT accessToken
  ✓ PASS: Trả về JWT refreshToken
  ✓ PASS: Tài khoản có vai trò ADMIN
  ✓ PASS: Thông báo lỗi chung, không tiết lộ chi tiết mật khẩu/email

[TEST GROUP 2] Bảo vệ chống tấn công Brute-force:
  ✓ PASS: Khóa tạm 15 phút sau 5 lần sai liên tiếp

[TEST GROUP 3] Phân quyền Dữ liệu nhạy cảm (Cost Price - giaVon):
  ✓ PASS: Nhân viên kinh doanh (SALES_REP) TUYỆT ĐỐI KHÔNG thấy trường giaVon
  ✓ PASS: Giám đốc kinh doanh (DIRECTOR) xem được đầy đủ trường giaVon

[TEST GROUP 4] Ràng buộc Nghiệp vụ Người dùng & Nhóm:
  ✓ PASS: Chặn thành công việc Admin tự thu hồi quyền của chính mình

[TEST GROUP 5] Phân trang & Tìm kiếm:
  ✓ PASS: Phân trang mặc định 20 dòng
  ✓ PASS: Tìm thấy đủ số lượng người dùng mẫu

========================================
KẾT QUẢ KIỂM THỬ: 10 PASS, 0 FAIL
========================================
```

---

## 3. Môi trường Thực thi Hiện tại

* **Backend Service:** Đang chạy tại `http://localhost:3000/api` (Swagger: `http://localhost:3000/api/docs`)
* **Frontend Service:** Đang chạy tại `http://localhost:5173`
* **Tài khoản Demo sẵn có:**
  * Quản trị viên: `admin@crm.vn` | Mật khẩu: `Password@123`
  * Giám đốc kinh doanh: `director@crm.vn` | Mật khẩu: `Password@123`
  * Trưởng nhóm Hà Nội: `lead_hn@crm.vn` | Mật khẩu: `Password@123`
  * Nhân viên kinh doanh: `sales_hn1@crm.vn` | Mật khẩu: `Password@123`
