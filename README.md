# Customer and Sales Opportunity Management System (CRM)

> **Hệ thống Quản lý Khách hàng và Cơ hội Bán hàng**  
> Dự án phát triển CRM theo quy trình Agile / Scrum chia làm 4 Sprint hoàn thiện luồng thương vụ từ Lead → Khách hàng → Cơ hội → Báo giá → Hợp đồng → Dashboard/KPI.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

* **Backend:** [NestJS](https://nestjs.com/) (TypeScript) + [Prisma ORM](https://www.prisma.io/) + Passport JWT + Swagger/OpenAPI.
* **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) + [TailwindCSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/).
* **Cơ sở dữ liệu:** [PostgreSQL 17](https://www.postgresql.org/).

---

## 📌 Trạng thái triển khai: SPRINT 1 (FOUNDATION & CATALOG) - HOÀN TẤT

### 1. EP-01: Tài khoản & Phân quyền (Account, RBAC & Data Scope)
* **[S1-01] Đăng nhập & Bảo vệ Brute-force:** Xác thực email/mật khẩu, mã hóa bcrypt, khóa tạm 15 phút sau 5 lần sai liên tiếp.
* **[S1-02] Quản lý phiên an toàn:** JWT Access & Refresh token pair, thu hồi phiên khi đăng xuất.
* **[S1-03] Quên mật khẩu:** Tạo liên kết và token đặt lại mật khẩu có hiệu lực 30 phút.
* **[S1-04] Đổi mật khẩu chủ động:** Yêu cầu mật khẩu hiện tại, kiểm tra độ mạnh, thu hồi các phiên đăng nhập khác.
* **[S1-05] Phân quyền 7 vai trò chuẩn & Data Scope:** Kiểm soát phạm vi dữ liệu (`MY_DATA`, `TEAM_DATA`, `ALL_DATA`) tại tầng Backend query.
* **[S1-06] Menu điều hướng theo quyền:** Hiển thị chức năng theo quyền, tương thích responsive từ 360px.
* **[S1-07] Trang báo lỗi chuẩn:** Giao diện 403, 404 có gợi ý hành động quay lại.
* **[S1-08] Quản trị người dùng:** CRUD, tìm kiếm, lọc theo vai trò/trạng thái/nhóm, phân trang chuẩn 20 dòng.
* **[S1-09] Gán vai trò & Cây tổ chức:** Gán nhiều vai trò, ràng buộc Trưởng nhóm phải thuộc nhóm, chống Admin tự tước quyền của mình.
* **[S1-10] Khóa tài khoản & Bàn giao dữ liệu:** Bắt buộc chỉ định người tiếp nhận trước khi khóa tài khoản.
* **[S2-02] Hồ sơ cá nhân:** Cập nhật họ tên, SĐT Việt Nam hợp lệ, chữ ký email.
* **[S2-04] Nhật ký thay đổi (Audit Log):** Ghi vết người thực hiện, thời điểm, giá trị trước/sau đối với dữ liệu nhạy cảm.

### 2. EP-02: Danh mục & Cấu hình (Catalogs & Pipeline)
* **[S2-05] Danh mục Sản phẩm & Bảng giá:** Quản lý giá niêm yết, giá sàn (ngưỡng duyệt chiết khấu). **Giá vốn (`giaVon`) được bảo vệ nghiêm ngặt chỉ Director/Admin xem được.**
* **[S2-06] Cơ cấu tổ chức kinh doanh:** Cây nhóm kinh doanh phân cấp, trưởng nhóm, khu vực địa lý.
* **[S2-07] Danh mục dùng chung:** Ngành nghề, quy mô, nguồn lead, loại hoạt động.
* **[S2-09] Cấu hình Pipeline:** Chuỗi giai đoạn, tỷ lệ % xác suất thắng, điều kiện rời giai đoạn.
* **[S2-10] Lý do Thắng/Thua & Đối thủ:** Danh mục lý do thắng thua tách biệt và danh sách đối thủ cạnh tranh.

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy cục bộ (Getting Started)

### 1. Yêu cầu môi trường
* Node.js >= 18 (Khuyên dùng v20 hoặc v24)
* PostgreSQL 17 đang chạy tại cổng `5432`

### 2. Cài đặt & Khởi động Backend
```bash
cd backend
npm install
cp .env.example .env

# Đồng bộ database schema và nạp dữ liệu mẫu ban đầu
npx prisma db push
npx ts-node prisma/seed.ts

# Khởi động Backend
npm run start:dev
```
* Backend API: `http://localhost:3000/api`
* Swagger Docs: `http://localhost:3000/api/docs`

### 3. Cài đặt & Khởi động Frontend
```bash
cd frontend
npm install

# Khởi động Frontend
npm run dev
```
* Giao diện người dùng: `http://localhost:5173`

---

## 🔑 Tài khoản mẫu thử nghiệm (Mật khẩu mặc định: `Password@123`)

| Vai trò | Email đăng nhập | Quyền hạn dữ liệu (Data Scope) |
| :--- | :--- | :--- |
| **Admin (Quản trị viên)** | `admin@crm.vn` | Toàn quyền cấu hình, tài khoản, audit logs |
| **Director (Giám đốc kinh doanh)** | `director@crm.vn` | Xem toàn bộ (`ALL_DATA`), xem/sửa giá vốn |
| **Team Lead (Trưởng nhóm HN)** | `lead_hn@crm.vn` | Xem toàn bộ nhóm Hà Nội (`TEAM_DATA`) |
| **Sales Rep (Nhân viên Sales)** | `sales_hn1@crm.vn` | Chỉ xem dữ liệu cá nhân (`MY_DATA`), ẩn giá vốn |
| **Marketing** | `marketing@crm.vn` | Quản lý nguồn lead và chiến dịch |
| **Customer Success** | `csm@crm.vn` | Chăm sóc khách hàng sau bán |
| **Accountant (Kế toán)** | `accountant@crm.vn` | Theo dõi hợp đồng và thanh toán |
