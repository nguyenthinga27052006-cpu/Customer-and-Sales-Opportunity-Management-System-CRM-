# Kế Hoạch Triển Khai SPRINT 3: OPPORTUNITY + PIPELINE + ACTIVITY + CALENDAR

Tài liệu này xác định chi tiết kế hoạch kiến trúc, cơ sở dữ liệu, backend, API contract, frontend, kiểm thử và hồi quy cho **Sprint 3** (EP-05: Cơ hội & Pipeline - 48 pts và EP-06: Hoạt động & Lịch làm việc - 30 pts, Tổng: 78 pts Must-Have).

---

## 1. User Review Required

> [!IMPORTANT]
> - **Kế thừa & Mở rộng Foundation Sprint 1 & 2:** Giữ nguyên toàn bộ cấu trúc DB và code hiện có. Tuyệt đối không tạo model song song (`co_hoi_2`, `hoat_dong_new`). Chúng ta mở rộng model `CoHoi` và `HoatDong` đã được tạo tối thiểu ở Sprint 2.
> - **Opportunity là Trung tâm (Single Source of Truth):**
>   - Giá trị cơ hội (`giaTriDuKien`) và dự báo (`duBaoGiaTri`) được tính toán **100% tại Server** từ chi tiết các dòng sản phẩm (`CoHoiSanPham`) và xác suất thắng của giai đoạn (`xacSuat`). Frontend tuyệt đối không tự tính để làm dữ liệu lưu trữ.
>   - Đổi dòng sản phẩm hoặc đổi giai đoạn sẽ tự động cập nhật ngay lập tức `giaTriDuKien` và `duBaoGiaTri`.
> - **Pipeline Kanban Performance & Logic:**
>   - Card Query tối ưu: Chỉ tải các trường cần thiết cho card (mã, tên cơ hội, khách hàng, giá trị, ngày chốt, cảnh báo đình trệ, người sở hữu) để đảm bảo render và kéo thả mượt mà trên 300 cơ hội.
>   - Kéo thả có kiểm soát: Gọi API chuyển giai đoạn; nếu thất bại (do thiếu điều kiện bắt buộc hoặc vi phạm quyền), UI tự động rollback về cột ban đầu và hiển thị thông báo lỗi.
> - **Ràng buộc Chuyển Giai Đoạn (S5-04):**
>   - Kiểm tra điều kiện bắt buộc trước khi chuyển sang giai đoạn mới (ví dụ: cần có tối thiểu 1 cuộc gặp/cuộc gọi trao đổi nhu cầu).
>   - Cho phép Trưởng nhóm trở lên (`TEAM_LEAD`, `DIRECTOR`, `ADMIN`) ghi đè (override) kèm lý do bắt buộc.
> - **Đóng Thắng / Đóng Thua (S5-05):**
>   - Đóng Thắng (`DONG_THANG`): Bắt buộc nhập giá trị chốt thực tế (`giaTriThucTe`) và ngày ký hợp đồng (`ngayKyDuKien`).
>   - Đóng Thua (`DONG_THUA`): Bắt buộc chọn lý do thua (`lyDoThangThuaId`), tùy chọn đối thủ thắng thầu (`doiThuId`) và ghi chú.
>   - Cơ hội đã đóng chuyển sang trạng thái Read-only; chỉ Trưởng nhóm trở lên được quyền mở lại kèm lý do.
> - **Hoạt động, Công việc & Lịch làm việc (EP-06):**
>   - Dùng chung model `HoatDong` mở rộng để lưu trữ: Cuộc gọi (`GOI_DIEN`), Cuộc gặp (`GAP_MAT`), Email (`EMAIL`), Ghi chú (`GHI_CHU`), và Công việc (`CONG_VIEC` / Task).
>   - Timeline tổng hợp: Tải nhanh tương tác đa chiều (khách hàng, người liên hệ, cơ hội) đạt mục tiêu **< 1.5s cho 500+ records**.
>   - Lịch làm việc (Calendar): Tổng hợp cuộc gặp đã đặt và công việc có hạn trong cùng khung nhìn Ngày, Tuần, Tháng theo chuẩn múi giờ `Asia/Ho_Chi_Minh`.
>   - Kiểm tra quá hạn: So sánh hạn công việc với giờ Server thực tế (`hanHoanThanh < Server Now && trangThai != 'HOAN_THANH'`).

---

## 2. Open Questions & Thiết Kế Kiến Trúc Đã Tối Ưu

- **Kanban Drag & Drop:** Sử dụng HTML5 Drag and Drop API native tiêu chuẩn (không thêm thư viện bên ngoài cồng kềnh), đảm bảo tương thích 100% với React 18, không phát sinh lỗi dependency hoặc build trên môi trường Windows.
- **Múi giờ hệ thống:** Toàn bộ ngày giờ được chuẩn hóa ISO UTC trên DB và convert sang múi giờ `Asia/Ho_Chi_Minh` (+07:00) trên Frontend và báo cáo.
- **Lead Conversion Golden Flow:** Cơ hội bán hàng được sinh ra từ việc chuyển đổi Lead ở Sprint 2 (`DA_CHUYEN_DOI`) ngay lập tức xuất hiện trên bảng Kanban, hỗ trợ thêm sản phẩm, chuyển giai đoạn và ghi nhận hoạt động mà không cần bất kỳ bước di trú dữ liệu nào.

---

## 3. Proposed Changes

### Database Layer (`backend/prisma/schema.prisma`)

#### [MODIFY] [schema.prisma](file:///d:/Projects/Customer%20and%20Sales%20Opportunity%20Management%20System%20(CRM)/backend/prisma/schema.prisma)
1. **Mở rộng `CoHoi`**:
   - `nguoiLienHeId`: `String?` (Người liên hệ chính)
   - `nhomKinhDoanhId`: `String?` (Nhóm kinh doanh phụ trách)
   - `xacSuat`: `Int` @default(10) (Xác suất thắng, mặc định theo giai đoạn, cho phép sửa tay kèm ghi chú)
   - `ghiChuXacSuat`: `String?`
   - `duBaoGiaTri`: `Decimal` @default(0) @db.Decimal(15, 2)
   - `nguonCoHoi`: `String?`
   - `moTa`: `String?`
   - `giaTriThucTe`: `Decimal?` @db.Decimal(15, 2)
   - `ngayDongThucTe`: `DateTime?`
   - `lyDoThangThuaId`: `String?`
   - `doiThuId`: `String?`
   - `ghiChuDong`: `String?`
   - `ngayHoatDongCuoi`: `DateTime?`
   - `laDinhTre`: `Boolean` @default(false)
   - Relations:
     - `sanPhamCoHoi`: `CoHoiSanPham[]`
     - `nguoiLienHe`: `NguoiLienHe?`
     - `nhomKinhDoanh`: `NhomKinhDoanh?`
     - `lyDoThangThua`: `LyDoThangThua?`
     - `doiThu`: `DoiThu?`
     - `lichSuChuyenGiaiDoan`: `LichSuChuyenGiaiDoan[]`

2. **Tạo model `CoHoiSanPham` (S5-03)**:
   - `id`: String @id @default(uuid())
   - `coHoiId`: String
   - `sanPhamId`: String
   - `soLuong`: Int @default(1)
   - `donGia`: Decimal @db.Decimal(15, 2)
   - `chietKhauPhanTram`: Decimal @default(0) @db.Decimal(5, 2)
   - `chietKhauSoTien`: Decimal @default(0) @db.Decimal(15, 2)
   - `thanhTien`: Decimal @db.Decimal(15, 2)
   - `soKyThueBao`: Int? @default(1)
   - `giaTriNam`: Decimal? @db.Decimal(15, 2)
   - `ghiChu`: String?
   - `createdAt`, `updatedAt`

3. **Tạo model `LichSuChuyenGiaiDoan` (S6-01)**:
   - `id`: String @id @default(uuid())
   - `coHoiId`: String
   - `giaiDoanTruocId`: String?
   - `giaiDoanSauId`: String
   - `giaTriTruoc`: Decimal? @db.Decimal(15, 2)
   - `giaTriSau`: Decimal? @db.Decimal(15, 2)
   - `ngayChotTruoc`: DateTime?
   - `ngayChotSau`: DateTime?
   - `nguoiSoHuuTruocId`: String?
   - `nguoiSoHuuSauId`: String?
   - `lyDoChuyen`: String?
   - `ghiDeDieuKien`: Boolean @default(false)
   - `nguoiThucHienId`: String
   - `createdAt`: DateTime @default(now())

4. **Mở rộng `HoatDong` (EP-06 S6-05, S6-06, S6-09)**:
   - `thoiLuongPhut`: Int?
   - `diaDiem`: String?
   - `ketQua`: String?
   - `hanHoanThanh`: DateTime? (Cho Task)
   - `trangThaiCongViec`: String? @default("CHUA_HOAN_THANH") // CHUA_HOAN_THANH, HOAN_THANH, HOAN_HUY
   - `mucDoUuTien`: String? @default("TRUNG_BINH") // THAP, TRUNG_BINH, CAO, KHAN_CAP
   - `nguoiDuocGiaoId`: String?
   - `ngayHoanThanh`: DateTime?
   - `lyDoHoanHuy`: String?
   - `thoiGianNhacNho`: DateTime?
   - `daNhacNho`: Boolean @default(false)
   - Relation: `nguoiDuocGiao`: `NguoiDung?`

5. **Mở rộng `GiaiDoanPipeline` (S5-07)**:
   - `soNgayDinhTre`: Int @default(7)

6. **Tạo model `ChiTieuDoanhSo` (S5-06)**:
   - `id`: String @id @default(uuid())
   - `nguoiDungId`: String?
   - `nhomKinhDoanhId`: String?
   - `nam`: Int
   - `thang`: Int?
   - `quy`: Int?
   - `chiTieu`: Decimal @db.Decimal(15, 2)
   - `createdAt`, `updatedAt`

---

### Backend Modules (`backend/src/modules/`)

#### 1. Module Cơ hội & Pipeline (`co-hoi/`)
- [NEW] `backend/src/modules/co-hoi/dto/co-hoi.dto.ts`:
  - `TaoCoHoiDto`, `CapNhatCoHoiDto`, `LocCoHoiDto`, `ChuyenGiaiDoanDto`, `DongThangDto`, `DongThuaDto`, `MoLaiCoHoiDto`, `BanGiaoCoHoiDto`
- [NEW] `backend/src/modules/co-hoi/dto/co-hoi-san-pham.dto.ts`:
  - `ThemSanPhamCoHoiDto`, `CapNhatSanPhamCoHoiDto`
- [NEW] `backend/src/modules/co-hoi/services/co-hoi.service.ts`:
  - CRUD Cơ hội, sinh mã tự động `CH-xxxxxx`, kiểm tra ngày chốt không ở quá khứ khi tạo mới, phân quyền Data Scope.
- [NEW] `backend/src/modules/co-hoi/services/co-hoi-product.service.ts`:
  - Thêm, sửa, xóa sản phẩm trong cơ hội. Tính toán chính xác `thanhTien` = `soLuong * donGia - chietKhauSoTien`.
  - Tự động gọi transaction cập nhật `giaTriDuKien` = tổng `thanhTien` của cơ hội và tính lại `duBaoGiaTri`.
- [NEW] `backend/src/modules/co-hoi/services/co-hoi-stage.service.ts`:
  - Chuyển giai đoạn Kanban; kiểm tra điều kiện bắt buộc (ví dụ: cần có cuộc họp/cuộc gọi); cho phép ghi đè đối với Trưởng nhóm trở lên; cập nhật xác suất thắng theo giai đoạn và tính lại forecast; ghi lịch sử chuyển giai đoạn.
- [NEW] `backend/src/modules/co-hoi/services/co-hoi-forecast.service.ts`:
  - Tính toán Weighted Forecast theo tháng này, tháng sau, quý này; so sánh với chỉ tiêu (`chiTieu`) và doanh số thực tế đã chốt; phân nhóm theo nhân viên và theo team kinh doanh.
- [NEW] `backend/src/modules/co-hoi/services/co-hoi-stalled.service.ts`:
  - Quét và gắn cờ đình trệ (`laDinhTre = true`) nếu cơ hội không có hoạt động trong N ngày hoặc đã quá ngày dự kiến chốt mà chưa đóng.
- [NEW] `backend/src/modules/co-hoi/controllers/co-hoi.controller.ts`:
  - Endpoint CRUD, chi tiết, đóng thắng, đóng thua, mở lại, bàn giao cơ hội.
- [NEW] `backend/src/modules/co-hoi/controllers/co-hoi-kanban.controller.ts`:
  - Endpoint Kanban tối ưu: `GET /api/co-hoi/kanban` trả về danh sách các cột giai đoạn cùng tổng số lượng, tổng giá trị, và danh sách card nhẹ.
- [NEW] `backend/src/modules/co-hoi/controllers/co-hoi-forecast.controller.ts`:
  - Endpoint báo cáo dự báo: `GET /api/co-hoi/forecast/report`.
- [NEW] `backend/src/modules/co-hoi/co-hoi.module.ts`:
  - Đăng ký controller, service, export để các module khác dùng chung.

#### 2. Module Hoạt động & Lịch làm việc (`hoat-dong/`)
- [NEW] `backend/src/modules/hoat-dong/dto/hoat-dong.dto.ts`:
  - `TaoHoatDongDto`, `CapNhatHoatDongDto`, `LocHoatDongDto`
- [NEW] `backend/src/modules/hoat-dong/dto/cong-viec.dto.ts`:
  - `TaoCongViecDto`, `CapNhatCongViecDto`, `CapNhatTrangThaiCongViecDto`
- [NEW] `backend/src/modules/hoat-dong/services/hoat-dong.service.ts`:
  - Ghi nhận Cuộc gọi, Cuộc gặp, Email, Ghi chú; gắn quan hệ Khách hàng, Người liên hệ, Cơ hội; cập nhật `ngayHoatDongCuoi` của Cơ hội tương ứng để giải phóng cờ đình trệ; tổng hợp Timeline đa chiều (< 1.5s).
- [NEW] `backend/src/modules/hoat-dong/services/cong-viec.service.ts`:
  - Quản lý công việc (Task): Hạn chót, mức độ ưu tiên, người được giao, đánh dấu hoàn thành/hoãn hủy; tính toán quá hạn theo giờ Server.
- [NEW] `backend/src/modules/hoat-dong/services/lich-lam-viec.service.ts`:
  - Tổng hợp Lịch làm việc cá nhân & nhóm (kết hợp Cuộc gặp và Công việc) theo ngày, tuần, tháng trong múi giờ `Asia/Ho_Chi_Minh`.
- [NEW] `backend/src/modules/hoat-dong/controllers/hoat-dong.controller.ts`:
  - Endpoint CRUD hoạt động, timeline khách hàng `GET /api/khach-hang/:id/timeline`, timeline cơ hội `GET /api/co-hoi/:id/timeline`.
- [NEW] `backend/src/modules/hoat-dong/controllers/cong-viec.controller.ts`:
  - Endpoint CRUD công việc, đổi trạng thái, danh sách việc quá hạn.
- [NEW] `backend/src/modules/hoat-dong/controllers/lich-lam-viec.controller.ts`:
  - Endpoint `GET /api/lich-lam-viec` xem lịch cá nhân hoặc cả nhóm (áp dụng Data Scope).
- [NEW] `backend/src/modules/hoat-dong/hoat-dong.module.ts`:
  - Đăng ký controller, service.

#### 3. Cập nhật `AppModule` & `Seed`
- [MODIFY] `backend/src/app.module.ts`: Đăng ký `CoHoiModule`, `HoatDongModule`.
- [MODIFY] `backend/prisma/seed.ts`: Bổ sung dữ liệu mẫu cho cơ hội thực tế, chi tiết sản phẩm trong cơ hội, hoạt động mẫu, công việc mẫu và chỉ tiêu doanh số.

---

### Frontend Modules (`frontend/src/`)

#### 1. Types & Services
- [NEW] `frontend/src/types/opportunity.types.ts`:
  - Giai đoạn Kanban, Cơ hội, Dòng sản phẩm trong cơ hội, Forecast, Lịch sử chuyển giai đoạn, Lý do thắng thua, Đối thủ.
- [NEW] `frontend/src/types/activity.types.ts`:
  - Hoạt động tương tác, Timeline item, Task/Công việc, Calendar event.
- [NEW] `frontend/src/services/opportunity.service.ts`:
  - Gọi API cơ hội, kanban, sản phẩm cơ hội, chuyển stage, đóng thắng/thua, forecast.
- [NEW] `frontend/src/services/activity.service.ts`:
  - Gọi API hoạt động, timeline, công việc, lịch làm việc.

#### 2. Components
- **Cơ hội & Pipeline**:
  - [NEW] `frontend/src/components/opportunities/OpportunityModal.tsx` (Tạo/Sửa cơ hội, chọn KH, người liên hệ, giai đoạn, ngày chốt).
  - [NEW] `frontend/src/components/opportunities/KanbanColumn.tsx` (Cột giai đoạn, badge số lượng, tổng giá trị).
  - [NEW] `frontend/src/components/opportunities/KanbanCard.tsx` (Thẻ cơ hội kéo thả, tên KH, giá trị VND, hạn chốt, badge cảnh báo đình trệ).
  - [NEW] `frontend/src/components/opportunities/OpportunityProductModal.tsx` (Thêm/Sửa sản phẩm, đơn giá, chiết khấu, số kỳ thuê bao).
  - [NEW] `frontend/src/components/opportunities/OpportunityStageModal.tsx` (Chuyển giai đoạn, cảnh báo điều kiện bắt buộc, tùy chọn ghi đè cho Leader).
  - [NEW] `frontend/src/components/opportunities/OpportunityCloseModal.tsx` (Hộp thoại Đóng Thắng với giá trị thực tế/ngày ký; hoặc Đóng Thua với lý do/đối thủ).
  - [NEW] `frontend/src/components/opportunities/OpportunityReassignModal.tsx` (Chuyển giao người sở hữu cơ hội kèm lý do).
- **Hoạt động & Lịch làm việc**:
  - [NEW] `frontend/src/components/activities/ActivityModal.tsx` (Ghi nhận Cuộc gọi, Cuộc gặp, Email, Ghi chú với thời lượng, địa điểm, kết quả).
  - [NEW] `frontend/src/components/activities/TaskModal.tsx` (Tạo/Sửa công việc, hạn hoàn thành, mức ưu tiên, người được giao).
  - [NEW] `frontend/src/components/activities/ActivityTimeline.tsx` (Dòng thời gian tương tác trực quan với icon và bộ lọc theo loại hoạt động).
  - [NEW] `frontend/src/components/calendar/CalendarView.tsx` (Lịch theo Ngày / Tuần / Tháng, hiển thị cuộc gặp và công việc, phân màu trạng thái).

#### 3. Pages & Routing
- [NEW] `frontend/src/pages/OpportunityListPage.tsx` (Bảng danh sách cơ hội dạng Table, tìm kiếm, lọc nâng cao, xuất/tạo mới).
- [NEW] `frontend/src/pages/PipelineKanbanPage.tsx` (Bảng Kanban kéo thả đa cột, lọc người sở hữu, nhóm, khoảng ngày chốt).
- [NEW] `frontend/src/pages/OpportunityDetailPage.tsx` (Trang chi tiết Cơ hội 360: Thông tin chung, Dòng sản phẩm & Tổng giá trị, Forecast, Timeline hoạt động, Đóng Thắng/Thua).
- [NEW] `frontend/src/pages/ForecastReportPage.tsx` (Báo cáo dự báo doanh số theo xác suất, so sánh chỉ tiêu và số thực tế theo tháng/quý).
- [NEW] `frontend/src/pages/ActivityListPage.tsx` (Quản lý và thống kê hoạt động theo thành viên và thời gian).
- [NEW] `frontend/src/pages/TaskListPage.tsx` (Quản lý công việc cá nhân và nhóm, làm nổi bật công việc quá hạn).
- [NEW] `frontend/src/pages/CalendarPage.tsx` (Lịch làm việc tích hợp cá nhân và nhóm).
- [MODIFY] `frontend/src/App.tsx`: Đăng ký các routes:
  - `/opportunities`, `/opportunities/kanban`, `/opportunities/:id`, `/forecast`, `/activities`, `/tasks`, `/calendar`.
- [MODIFY] `frontend/src/components/common/Sidebar.tsx`: Thêm menu điều hướng trực quan cho Cơ hội bán hàng, Pipeline Kanban, Dự báo doanh số, Lịch & Công việc.

---

## 4. Verification Plan

### Automated Tests (`backend/test/sprint3_verification.ts`)
Tạo bộ kiểm thử tự động toàn diện kiểm chứng 10 nhóm tiêu chuẩn chấp thuận (Acceptance Criteria):
1. **Opportunity CRUD & Validations (S5-01):**
   - Tạo cơ hội tự sinh mã `CH-xxxxxx`.
   - Bắt lỗi khi ngày dự kiến chốt ở quá khứ khi tạo mới.
   - Xác suất thắng lấy đúng theo giai đoạn cấu hình.
2. **Data Scope Isolation:**
   - Sales A không được xem/sửa/xóa cơ hội của Sales B.
   - Team Lead xem được cơ hội của toàn nhóm.
   - Director xem được toàn bộ cơ hội.
3. **Opportunity Product & Value Recalculation (S5-03):**
   - Thêm sản phẩm vào cơ hội, tính đúng thành tiền từng dòng.
   - Server tự động tính lại tổng giá trị cơ hội (`giaTriDuKien`) = tổng thành tiền các sản phẩm.
4. **Stage Transition & Mandatory Conditions (S5-04):**
   - Chặn chuyển giai đoạn nếu chưa thỏa điều kiện (ví dụ: chưa có cuộc gặp nào).
   - Cho phép Trưởng nhóm ghi đè kèm lý do.
5. **Weighted Forecast Calculation (S5-06):**
   - Kiểm tra công thức `duBaoGiaTri = giaTriDuKien * (xacSuat / 100)`.
   - Tự động cập nhật khi đổi sản phẩm hoặc đổi giai đoạn/xác suất.
6. **Close Won / Lost & Read-Only Lock (S5-05):**
   - Đóng Thắng bắt buộc có `giaTriThucTe` và `ngayKyDuKien`.
   - Đóng Thua bắt buộc có `lyDoThangThuaId`.
   - Cơ hội đã đóng bị khóa không cho sửa; mở lại bắt buộc quyền Team Lead+ kèm lý do.
7. **Stalled Opportunity Detection (S5-07):**
   - Kiểm tra gắn cờ `laDinhTre = true` khi vượt ngưỡng N ngày không có hoạt động hoặc quá ngày dự kiến chốt.
8. **Ownership Handover (S5-08):**
   - Chuyển giao người sở hữu cơ hội, lưu vết vào audit log.
9. **Activity & Customer/Opportunity Timeline (S6-05, S6-08):**
   - Ghi nhận Cuộc gọi, Cuộc gặp, Email, Ghi chú.
   - Timeline tổng hợp hoạt động của cơ hội và khách hàng phản hồi nhanh dưới 1.5s.
10. **Task Overdue & Calendar (S6-06, S6-07, S6-09):**
    - Kiểm tra công việc quá hạn dựa trên giờ Server.
    - API Lịch trả về đúng cả cuộc gặp và công việc trong múi giờ `Asia/Ho_Chi_Minh`.

### Regression Verification
1. Chạy `backend/test/sprint1_verification.ts`: Đảm bảo 10/10 PASS.
2. Chạy `backend/test/sprint2_verification.ts`: Đảm bảo 31/31 PASS.
3. Kiểm tra Golden Flow: Lead Sprint 2 chuyển đổi thành Khách hàng + Cơ hội -> Cơ hội ngay lập tức xuất hiện trên Pipeline Kanban Sprint 3 -> Thêm sản phẩm -> Tính Forecast -> Di chuyển giai đoạn -> Ghi nhận hoạt động -> Hoàn thành.
