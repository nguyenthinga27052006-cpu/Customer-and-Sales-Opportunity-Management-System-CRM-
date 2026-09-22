# KẾ HOẠCH TRIỂN KHAI SPRINT 1: NỀN TẢNG HỆ THỐNG & CẤU HÌNH (FOUNDATION & CATALOG)

## 1. Bối cảnh & Khảo sát hiện trạng (Baseline Assessment)

### 1.1. Khảo sát Repository hiện tại (Step 1 & Step 2)
* **Thư mục dự án:** `d:\Projects\Customer and Sales Opportunity Management System (CRM)`
* **Mã nguồn hiện có:** Chưa có mã nguồn (Repository mới chỉ chứa file tài liệu phân tích `Tai Lieu phan tich backlog_CRM.docx` và file Excel backlog `HỆ THỐNG QUẢN LÝ KHÁCH HÀNG.xlsx`).
* **Hạ tầng cục bộ:**
  * Node.js: `v24.19.0`
  * npm: `11.17.0`
  * PostgreSQL: `17.10` đang chạy trên cổng `5432` (`127.0.0.1:5432`, user: `postgres`)
  * Docker daemon: Chưa khởi động (ưu tiên chạy trực tiếp qua Node.js & PostgreSQL cục bộ).
* **Kiến trúc chốt theo Tài liệu phân tích backlog (Mục 7 - Phương án B):**
  * **Frontend:** React 18+ với TypeScript, Vite, React Router DOM, Axios/Fetch, TailwindCSS & Lucide icons.
  * **Backend:** NestJS (TypeScript) - Kiến trúc module hóa chuẩn công nghiệp, DTO Validation, Guards, Interceptors, Filters, Prisma ORM.
  * **Database:** PostgreSQL 17 (`crm_db`), quản lý migration và schema qua Prisma Migration & Seed script.
  * **API Standard:** RESTful JSON, Swagger/OpenAPI tích hợp tại `/api/docs`.

---

## 2. Phạm vi Sprint 1 (Sprint 1 Scope)

Sprint 1 tập trung giải quyết 2 Epic nền tảng:
* **EP-01: Tài khoản & Phân quyền (Account, Authentication & RBAC / Data Scope)**
* **EP-02: Danh mục & Cấu hình (Catalogs, Organization, Products, Pricing & Pipeline Stages)**

### Danh sách User Story thực hiện trong Sprint 1:
1. **[S1-01] Đăng nhập & Khóa bảo vệ (5 pts, Must):** Xác thực email công ty/mật khẩu, mã hóa bcrypt/argon2, khóa tạm 15 phút sau 5 lần đăng nhập sai.
2. **[S1-02] Quản lý phiên & Đăng xuất an toàn (3 pts, Must):** JWT Access Token & Refresh Token, cơ chế thu hồi token (revocation) tại server khi logout.
3. **[S1-03] Quên & Đặt lại mật khẩu (5 pts, Must):** Tạo mã đặt lại dùng 1 lần, hiệu lực 30 phút, bảo mật không làm lộ email người dùng.
4. **[S1-04] Đổi mật khẩu chủ động (2 pts, Must):** Xác thực mật khẩu cũ, mật khẩu mới tối thiểu 8 ký tự kèm chữ + số, vô hiệu hóa phiên cũ.
5. **[S1-05] RBAC & Phân quyền dữ liệu Data Scope (8 pts, Must):** 7 vai trò chuẩn + 3 phạm vi dữ liệu (`MY_DATA`, `TEAM_DATA`, `ALL_DATA`). Bắt buộc filter tại Database Query (Prisma middleware / query builder), không để lọt ở backend.
6. **[S1-06] Menu & Giao diện điều hướng theo quyền (5 pts, Must):** Hiển thị chức năng theo quyền, responsive từ 360px trở lên.
7. **[S1-07] Trang xử lý lỗi chuẩn (1 pt, Should):** 401, 403, 404, 500 đồng bộ nhận diện thương hiệu và nút hành động quay lại.
8. **[S1-08] Quản trị người dùng (8 pts, Must):** CRUD người dùng, tìm kiếm theo họ tên/email/nhóm, lọc theo vai trò/trạng thái, phân trang chuẩn (mặc định 20 dòng).
9. **[S1-09] Gán vai trò & Cơ cấu tổ chức nhóm (3 pts, Must):** Gán nhiều vai trò, bắt buộc gán nhóm cho Trưởng nhóm, ngăn chặn tự thu hồi quyền Admin.
10. **[S1-10] Khóa tài khoản & Bàn giao dữ liệu (2 pts, Must):** Khóa tài khoản, thu hồi session, bắt buộc chọn người tiếp nhận khách hàng và cơ hội.
11. **[S2-02] Hồ sơ cá nhân (3 pts, Must):** Cập nhật họ tên, SĐT Việt Nam hợp lệ, chữ ký email; cấm tự đổi email/role/nhóm.
12. **[S2-04] Nhật ký thay đổi dữ liệu nhạy cảm Audit Log (3 pts, Must):** Ghi nhận người thực hiện, thời điểm, giá trị trước/sau khi đổi chiết khấu, chỉ tiêu, quyền sở hữu, vai trò; bộ lọc đa chiều.
13. **[S2-05] Danh mục sản phẩm & Bảng giá niêm yết (8 pts, Must):** Mã, tên, loại (một lần/thuê bao), ĐVT, giá niêm yết, giá sàn (ngưỡng duyệt chiết khấu), giá vốn (chỉ Director thấy/sửa). Ràng buộc không xóa sản phẩm đã có báo giá.
14. **[S2-06] Cơ cấu tổ chức kinh doanh & Khu vực (5 pts, Must):** Cây nhóm kinh doanh, trưởng nhóm, khu vực địa lý.
15. **[S2-07] Danh mục dùng chung bán hàng (5 pts, Must):** Ngành nghề, quy mô doanh nghiệp, nguồn lead, loại hoạt động; sắp xếp thứ tự; chống xóa khi đang tham chiếu.
16. **[S2-09] Cấu hình giai đoạn Pipeline & Xác suất (5 pts, Must):** Khai báo chuỗi giai đoạn bán hàng, xác suất thắng mặc định, điều kiện rời giai đoạn.
17. **[S2-10] Lý do thắng/thua & Đối thủ cạnh tranh (5 pts, Must):** Danh sách lý do thắng, lý do thua, danh sách đối thủ.

---

## 3. Kiến trúc kỹ thuật & Mô hình dữ liệu (Database Schema)

### 3.1. Các bảng dữ liệu trong Sprint 1 (Tuân thủ snake_case, PostgreSQL)
```sql
-- 1. Bảng vai trò và quyền hạn
vai_tro (id, ma_vai_tro, ten_vai_tro, mo_ta, created_at, updated_at)
quyen_han (id, ma_quyen, ten_quyen, mo_ta, module, created_at)
vai_tro_quyen_han (vai_tro_id, quyen_han_id)

-- 2. Khu vực & Nhóm kinh doanh (Cây tổ chức)
khu_vuc (id, ma_khu_vuc, ten_khu_vuc, mo_ta, created_at, updated_at)
nhom_kinh_doanh (id, ma_nhom, ten_nhom, nhom_cha_id, khu_vuc_id, truong_nhom_id, created_at, updated_at)

-- 3. Người dùng & Phân quyền
nguoi_dung (
    id, email, mat_khau_hash, ho_ten, so_dien_thoai, chu_ky_email, avatar_url,
    trang_thai, so_lan_dang_nhap_sai, khoa_den_khi, nhom_kinh_doanh_id,
    lan_dang_nhap_cuoi, created_at, updated_at
)
nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id)
phien_dang_nhap (id, nguoi_dung_id, refresh_token_hash, device_info, het_han_luc, da_thu_hoi, created_at)
dat_lai_mat_khau (id, nguoi_dung_id, token_hash, het_han_luc, da_su_dung, created_at)

-- 4. Nhật ký thay đổi (Audit Log)
nhat_ky_he_thong (
    id, nguoi_thuc_hien_id, loai_doi_tuong, doi_tuong_id, hanh_dong,
    gia_tri_truoc, gia_tri_sau, ip_address, user_agent, created_at
)

-- 5. Danh mục dùng chung (Dropdowns)
danh_muc_dung_chung (id, loai_danh_muc, ma_muc, ten_muc, thu_tu_hien_thi, kich_hoat, created_at, updated_at)

-- 6. Sản phẩm & Bảng giá
san_pham (
    id, ma_san_pham, ten_san_pham, loai_san_pham, don_vi_tinh,
    gia_niem_yet, gia_san, gia_von, trang_thai, mo_ta, created_at, updated_at
)

-- 7. Cấu hình Pipeline & Thắng / Thua
giai_doan_pipeline (id, ma_giai_doan, ten_giai_doan, thu_tu, xac_suat_thang, dieu_kien_bat_buoc, kich_hoat, created_at, updated_at)
ly_do_thang_thua (id, loai, noi_dung, thu_tu, kich_hoat, created_at, updated_at)
doi_thu (id, ten_doi_thu, diem_manh, diem_yeu, mo_ta, created_at, updated_at)
```

### 3.2. RBAC & Data Scope Enforcement (Mục tiêu cốt lõi)
* **7 Vai trò chuẩn:**
  1. `ADMIN` (Quản trị hệ thống) -> Data Scope: `ALL_DATA`
  2. `DIRECTOR` (Giám đốc kinh doanh) -> Data Scope: `ALL_DATA` (duy nhất xem/sửa giá vốn `gia_von`)
  3. `TEAM_LEAD` (Trưởng nhóm kinh doanh) -> Data Scope: `TEAM_DATA` (xem dữ liệu của toàn bộ nhân viên thuộc nhóm và nhóm con)
  4. `SALES_REP` (Nhân viên kinh doanh) -> Data Scope: `MY_DATA` (chỉ xem/sửa dữ liệu mình sở hữu `nguoi_so_huu_id = current_user.id`)
  5. `MARKETING` (Nhân viên marketing) -> Phụ trách nguồn lead, chiến dịch
  6. `CUST_SUCCESS` (Chăm sóc khách hàng) -> Hỗ trợ khách hàng sau bán
  7. `ACCOUNTANT` (Kế toán) -> Hợp đồng, thanh toán

* **Bắt buộc áp dụng tại Backend:**
  Tạo `DataScopeService` / Custom Prisma Extension tự động inject mệnh đề `WHERE nguoi_so_huu_id = ...` hoặc `WHERE nguoi_so_huu_id IN (team_member_ids)` vào mọi truy vấn khi vai trò là `SALES_REP` hoặc `TEAM_LEAD`.

---

## 4. Kế hoạch triển khai theo từng tầng (Level 0 đến Level 8)

### Giai đoạn 1: Khởi tạo nền móng (Phase 1A)
1. **Repository & Workspace Setup:**
   * Tạo thư mục `backend` (NestJS 10+, TypeScript, Prisma, Passport JWT, bcrypt, class-validator).
   * Tạo thư mục `frontend` (React 18, Vite, TypeScript, TailwindCSS, React Router v6, Axios, Lucide React).
   * Cấu hình `.env`, `.gitignore`, script khởi động chung.
2. **Database & Migration:**
   * Tạo database `crm_db` trong PostgreSQL 17.
   * Viết Prisma Schema chuẩn hóa toàn bộ thực thể của Sprint 1.
   * Chạy migration ban đầu và xây dựng `prisma/seed.ts` nạp sẵn 7 Vai trò, tài khoản Admin mặc định, các danh mục ban đầu, giai đoạn Pipeline mẫu.

### Giai đoạn 2: Backend Modules (Phase 1B, 1C, 1D, 1E)
1. **Module `auth`:** Đăng nhập, JWT token pair, refresh token, thu hồi phiên, đổi mật khẩu, quên mật khẩu, chống brute force (5 lần sai khóa 15p).
2. **Module `nguoi-dung` & `phan-quyen`:** CRUD người dùng, gán vai trò, gán nhóm kinh doanh, khóa tài khoản và bàn giao dữ liệu, hồ sơ cá nhân.
3. **Module `nhom-kinh-doanh` & `khu-vuc`:** Cây tổ chức phòng ban, quản lý khu vực địa lý, chỉ định trưởng nhóm.
4. **Module `audit-log`:** Interceptor tự động ghi nhật ký các thao tác nhạy cảm (thay đổi vai trò, đổi trạng thái tài khoản, thay đổi giá/chiết khấu).
5. **Module `san-pham`:** CRUD sản phẩm, bảng giá niêm yết, giá sàn, ẩn trường `gia_von` đối với vai trò không phải `DIRECTOR`/`ADMIN`.
6. **Module `cau-hinh` (Pipeline, Danh mục, Lý do thắng thua, Đối thủ):** API quản lý các bảng cấu hình dùng chung.

### Giai đoạn 3: Frontend Foundation & Pages (Phase 1F)
1. **Foundation UI:**
   * Design System: TailwindCSS tokens, Typography Google Fonts Inter, Color palette sang trọng (Slate / Indigo / Emerald).
   * App Layout: Sidebar điều hướng theo vai trò (collapsible, responsive 360px), Header hiển thị người dùng/vai trò/nhóm kinh doanh, breadcrumb, dropdown tài khoản.
   * State Management: AuthContext lưu user profile, permissions, token, tự động refresh token khi hết hạn.
   * Error Handling: Trang lỗi chuẩn 403, 404, 500 kèm nút quay lại.
2. **Screens:**
   * `LoginPage`: Đăng nhập, xử lý thông báo lỗi chuẩn, quên mật khẩu.
   * `ResetPasswordPage`: Nhập mã token đặt lại mật khẩu mới.
   * `ProfilePage`: Xem và cập nhật hồ sơ cá nhân, đổi mật khẩu.
   * `UserManagementPage`: Danh sách người dùng phân trang (20 dòng), modal thêm/sửa, gán vai trò, gán nhóm, modal khóa tài khoản & bàn giao dữ liệu.
   * `OrganizationTreePage`: Xem và quản lý cây sơ đồ nhóm kinh doanh, gán trưởng nhóm, khu vực.
   * `ProductCatalogPage`: Quản lý danh mục sản phẩm, bảng giá niêm yết, giá sàn, kiểm soát hiển thị giá vốn theo quyền.
   * `PipelineConfigPage`: Kéo thả sắp xếp giai đoạn pipeline, cài đặt xác suất thắng, điều kiện rời giai đoạn.
   * `GeneralSettingsPage`: Quản lý danh mục dùng chung (ngành nghề, nguồn lead, quy mô), lý do thắng thua, danh sách đối thủ.
   * `AuditLogPage`: Xem lịch sử thay đổi nhạy cảm kèm bộ lọc.

### Giai đoạn 4: Integration, Testing & Checkpoint (Level 5, 6, 7, 8)
1. **Integration:**
   * Tích hợp toàn diện FE - BE qua API Contract chuẩn REST.
   * Kiểm thử tự động Data Scope: Tạo tài khoản Sales A và Sales B, chứng minh quyền hạn cách ly triệt để.
   * Kiểm thử bảo mật: Brute force lockout, JWT expiration, Role-based route guard.
2. **Sprint 1 Checkpoint Review:**
   * Đối chiếu tất cả Definition of Done (DoD).
   * Chuẩn bị sẵn dữ liệu catalog nền tảng cho Sprint 2 (Khách hàng & Lead).

---

## 5. Verification Plan (Kế hoạch Kiểm thử & Xác minh)

### 5.1. Automated Tests
* **Prisma Seed Verification:** `npm run db:seed` chạy thành công, nạp đủ 7 vai trò, tài khoản mẫu cho từng vai trò (`admin@crm.vn`, `director@crm.vn`, `teamlead@crm.vn`, `sales_a@crm.vn`, `sales_b@crm.vn`).
* **Backend E2E / Unit Tests:**
  * Test đăng nhập thành công trả về access_token + refresh_token.
  * Test 5 lần đăng nhập sai dẫn đến khóa tài khoản 15 phút.
  * Test Sales A không thể xem thông tin nhạy cảm của người khác hoặc giá vốn sản phẩm (`gia_von`).
  * Test Director xem được toàn bộ và thấy trường `gia_von`.
* **API Documentation:** Truy cập `http://localhost:3000/api/docs` hiển thị đầy đủ Swagger contract.

### 5.2. Manual Verification Flow (Golden Foundation Flow)
1. Đăng nhập bằng tài khoản `admin@crm.vn`:
   * Truy cập Quản lý người dùng, tạo tài khoản mới, gán vai trò `SALES_REP` và nhóm kinh doanh.
   * Khóa một tài khoản và thực hiện bàn giao dữ liệu.
2. Đăng nhập bằng tài khoản `director@crm.vn`:
   * Khai báo danh mục sản phẩm, kiểm tra trường giá niêm yết, giá sàn, giá vốn.
   * Cấu hình các giai đoạn Pipeline (Tiếp cận 10%, Khảo sát 30%, Báo giá 60%, Đàm phán 80%, Chốt 100%).
   * Khai báo cây nhóm kinh doanh và gán trưởng nhóm.
3. Đăng nhập bằng tài khoản `sales_a@crm.vn`:
   * Kiểm tra menu chỉ hiển thị các mục được phân quyền.
   * Kiểm tra xem danh mục sản phẩm: Trường giá vốn (`gia_von`) hoàn toàn bị ẩn và API không trả về.
   * Cập nhật hồ sơ cá nhân (SĐT Việt Nam hợp lệ).
4. Kiểm tra trang Audit Log: Ghi nhận chính xác các thay đổi về tài khoản, vai trò và giá sản phẩm.
