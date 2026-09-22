import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeadScoringService } from './lead-scoring.service';
import { LeadAssignmentService } from './lead-assignment.service';
import * as xlsx from 'xlsx';

export interface RowError {
  row: number;
  column: string;
  reason: string;
}

export interface ExcelPreviewResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  errors: RowError[];
  previewRows: any[];
  validRowsToImport: any[];
}

@Injectable()
export class LeadExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: LeadScoringService,
    private readonly assignmentService: LeadAssignmentService,
  ) {}

  /**
   * Sinh mã Lead tiếp theo
   */
  private async sinhMaLead(countOffset: number = 0): Promise<string> {
    const count = await this.prisma.lead.count();
    const nextNum = (count + 1 + countOffset).toString().padStart(5, '0');
    return `LEAD-${nextNum}`;
  }

  /**
   * S4-02: Đọc file Excel / CSV, validate từng dòng và trả về kết quả xem trước (Preview)
   */
  async xemTruocFileExcel(fileBuffer: Buffer): Promise<ExcelPreviewResult> {
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    } catch (e: any) {
      throw new BadRequestException('File không đúng định dạng Excel hoặc CSV: ' + e.message);
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('File Excel không có sheet nào');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawData.length === 0) {
      throw new BadRequestException('File không chứa dữ liệu hoặc sheet trống');
    }

    // Lấy toàn bộ email và số điện thoại lead hiện có trong DB để check duplicate
    const existingLeads = await this.prisma.lead.findMany({
      select: { email: true, soDienThoai: true },
    });
    const existingEmails = new Set(existingLeads.map((l) => l.email?.toLowerCase()).filter(Boolean));
    const existingPhones = new Set(existingLeads.map((l) => l.soDienThoai).filter(Boolean));

    const errors: RowError[] = [];
    const validRowsToImport: any[] = [];
    let duplicateRowsCount = 0;

    const seenInFileEmails = new Set<string>();
    const seenInFilePhones = new Set<string>();

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // Dòng 1 là Header, dòng dữ liệu bắt đầu từ dòng 2

      // Chuẩn hóa tên cột hỗ trợ cả tiếng Việt có dấu và không dấu
      const hoTen = (row['Họ tên'] || row['HoTen'] || row['Full Name'] || row['hoTen'] || '').toString().trim();
      const nguonLead = (row['Nguồn Lead'] || row['NguonLead'] || row['Source'] || row['nguonLead'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
      const soDienThoai = (row['Số điện thoại'] || row['SoDienThoai'] || row['Phone'] || row['soDienThoai'] || '').toString().trim();
      const congTy = (row['Công ty'] || row['CongTy'] || row['Company'] || row['congTy'] || '').toString().trim();
      const chucDanh = (row['Chức danh'] || row['ChucDanh'] || row['Title'] || row['chucDanh'] || '').toString().trim();
      const nganhNghe = (row['Ngành nghề'] || row['NganhNghe'] || row['nganhNghe'] || '').toString().trim();
      const quyMo = (row['Quy mô'] || row['QuyMo'] || row['quyMo'] || '').toString().trim();
      const nhuCauQuanTam = (row['Nhu cầu quan tâm'] || row['NhuCau'] || row['nhuCauQuanTam'] || '').toString().trim();

      let rowHasError = false;

      // 1. Kiểm tra Họ tên (REQUIRED)
      if (!hoTen) {
        errors.push({ row: rowNum, column: 'Họ tên', reason: 'Họ tên không được để trống' });
        rowHasError = true;
      }

      // 2. Kiểm tra Nguồn Lead (BẮT BUỘC - Rule 5 S4-02: Source = REQUIRED)
      if (!nguonLead) {
        errors.push({ row: rowNum, column: 'Nguồn Lead', reason: 'Nguồn Lead là bắt buộc (Source = REQUIRED)' });
        rowHasError = true;
      }

      // 3. Validate Email nếu có
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: rowNum, column: 'Email', reason: 'Email không đúng định dạng' });
        rowHasError = true;
      }

      // 4. Kiểm tra trùng lặp (Duplicate Detection)
      let isDuplicate = false;
      if (email) {
        if (existingEmails.has(email) || seenInFileEmails.has(email)) {
          isDuplicate = true;
        }
      }
      if (soDienThoai) {
        if (existingPhones.has(soDienThoai) || seenInFilePhones.has(soDienThoai)) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        duplicateRowsCount++;
        errors.push({
          row: rowNum,
          column: 'Email / Số điện thoại',
          reason: 'Trùng lặp với Lead đã có trong hệ thống hoặc lặp lại trong file',
        });
        rowHasError = true;
      }

      if (!rowHasError) {
        if (email) seenInFileEmails.add(email);
        if (soDienThoai) seenInFilePhones.add(soDienThoai);

        validRowsToImport.push({
          hoTen,
          nguonLead,
          email: email || null,
          soDienThoai: soDienThoai || null,
          congTy: congTy || null,
          chucDanh: chucDanh || null,
          nganhNghe: nganhNghe || null,
          quyMo: quyMo || null,
          nhuCauQuanTam: nhuCauQuanTam || null,
        });
      }
    });

    return {
      totalRows: rawData.length,
      validRowsCount: validRowsToImport.length,
      invalidRowsCount: rawData.length - validRowsToImport.length,
      duplicateRowsCount,
      errors: errors.slice(0, 50), // Giới hạn hiển thị 50 lỗi đầu tiên
      previewRows: rawData.slice(0, 10), // Xem trước 10 dòng đầu
      validRowsToImport,
    };
  }

  /**
   * S4-02: Xác nhận Import các dòng hợp lệ vào CSDL
   * Mỗi dòng sau khi lưu sẽ tự động chạy Scoring Engine và Assignment Engine
   */
  async xacNhanImport(validRows: any[], currentUser: any): Promise<{
    tongSoDong: number;
    soDongThanhCong: number;
    danhSachLeadId: string[];
  }> {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestException('Không có dữ liệu hợp lệ để import');
    }

    const createdLeadIds: string[] = [];

    // Import tuần tự an toàn
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const maLead = await this.sinhMaLead(i);

      // 1. Tính điểm và phân loại
      const scoreResult = await this.scoringService.tinhDiem({
        nganhNghe: row.nganhNghe,
        quyMo: row.quyMo,
        nguonLead: row.nguonLead,
        nhuCauQuanTam: row.nhuCauQuanTam,
      });

      // 2. Tạo Lead
      const newLead = await this.prisma.lead.create({
        data: {
          maLead,
          hoTen: row.hoTen,
          email: row.email,
          soDienThoai: row.soDienThoai,
          congTy: row.congTy,
          chucDanh: row.chucDanh,
          nguonLead: row.nguonLead,
          nganhNghe: row.nganhNghe,
          quyMo: row.quyMo,
          nhuCauQuanTam: row.nhuCauQuanTam,
          diemTiemNang: scoreResult.diemTiemNang,
          phanLoai: scoreResult.phanLoai,
          trangThai: 'MOI',
        },
      });

      createdLeadIds.push(newLead.id);

      // 3. Chạy phân bổ tự động
      await this.assignmentService.phanBoLeadTuDong(newLead.id);
    }

    // Ghi Audit log
    await this.prisma.nhatKyHeThong.create({
      data: {
        nguoiThucHienId: currentUser.id,
        loaiDoiTuong: 'LEAD',
        hanhDong: 'TAO',
        giaTriSau: {
          loaiThaoTac: 'IMPORT_EXCEL',
          soLuongImport: createdLeadIds.length,
        },
      },
    });

    return {
      tongSoDong: validRows.length,
      soDongThanhCong: createdLeadIds.length,
      danhSachLeadId: createdLeadIds,
    };
  }
}
