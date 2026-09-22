import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DataScopeService } from '../../../common/services/data-scope.service';
import { ChuyenGiaiDoanDto } from '../dto/co-hoi.dto';
import { TrangThaiCoHoi } from '@prisma/client';
import { VaiTroEnum } from '../../../common/enums/role.enum';

@Injectable()
export class CoHoiStageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  /**
   * Story [S5-02, S5-04, S6-01]: Chuyển giai đoạn Pipeline trên Kanban có kiểm tra điều kiện bắt buộc
   */
  async chuyenGiaiDoan(id: string, dto: ChuyenGiaiDoanDto, currentUser: any) {
    const coHoi = await this.prisma.coHoi.findUnique({
      where: { id },
      include: {
        giaiDoan: true,
        khachHang: { select: { id: true, tenCongTy: true } },
      },
    });

    if (!coHoi) {
      throw new NotFoundException('Không tìm thấy cơ hội bán hàng');
    }

    if (coHoi.trangThai !== TrangThaiCoHoi.DANG_XU_LY) {
      throw new BadRequestException('Cơ hội đã đóng không thể chuyển giai đoạn');
    }

    // 1. Kiểm tra Data Scope
    const userIds = await this.dataScopeService.layDanhSachNguoiDungDuocXem(currentUser);
    if (userIds !== null && !userIds.includes(coHoi.nguoiSoHuuId)) {
      throw new ForbiddenException('Bạn không có quyền chuyển giai đoạn cho cơ hội này');
    }

    // 2. Kiểm tra giai đoạn đích
    const giaiDoanDich = await this.prisma.giaiDoanPipeline.findUnique({
      where: { id: dto.giaiDoanId },
    });
    if (!giaiDoanDich) {
      throw new NotFoundException('Giai đoạn đích không tồn tại');
    }

    if (giaiDoanDich.id === coHoi.giaiDoanId) {
      return coHoi; // Không thay đổi
    }

    // 3. Story [S5-04]: Kiểm tra điều kiện bắt buộc khi tiến giai đoạn
    const isMovingForward = giaiDoanDich.thuTu > coHoi.giaiDoan.thuTu;
    let ghiDeDieuKien = false;

    if (isMovingForward) {
      // Nếu chuyển sang giai đoạn Đề xuất giải pháp (Demo) hoặc Báo giá (thứ tự >= 3)
      if (giaiDoanDich.thuTu >= 3) {
        const activityCount = await this.prisma.hoatDong.count({
          where: {
            coHoiId: id,
            loaiHoatDong: { in: ['GOI_DIEN', 'GAP_MAT', 'CUOC_GOI', 'CUOC_GAP'] },
          },
        });

        if (activityCount === 0) {
          // Kiểm tra xem có yêu cầu ghi đè không
          if (dto.ghiDeDieuKien) {
            const roles: string[] = currentUser.roles || [];
            const isTeamLeadOrAbove =
              roles.includes(VaiTroEnum.ADMIN) ||
              roles.includes(VaiTroEnum.DIRECTOR) ||
              roles.includes(VaiTroEnum.TEAM_LEAD);

            if (!isTeamLeadOrAbove) {
              throw new ForbiddenException(
                'Chỉ Trưởng nhóm trở lên mới có quyền ghi đè điều kiện bắt buộc khi chuyển giai đoạn',
              );
            }
            ghiDeDieuKien = true;
          } else {
            const dieuKien =
              coHoi.giaiDoan.dieuKienBatBuoc ||
              'Chưa có cuộc gọi hoặc cuộc gặp nào được ghi nhận cho cơ hội này.';
            throw new BadRequestException(
              `Chưa thỏa điều kiện chuyển giai đoạn: "${dieuKien}". Cần hoàn thành tối thiểu 1 cuộc họp hoặc cuộc gọi tư vấn ghi nhận yêu cầu.`,
            );
          }
        }
      }
    }

    // 4. Cập nhật giai đoạn, xác suất và tính lại dự báo
    const xacSuat = giaiDoanDich.xacSuatThang;
    const duBaoGiaTri = (Number(coHoi.giaTriDuKien) * xacSuat) / 100;

    const [updated] = await this.prisma.$transaction([
      this.prisma.coHoi.update({
        where: { id },
        data: {
          giaiDoanId: giaiDoanDich.id,
          xacSuat,
          duBaoGiaTri,
          ngayHoatDongCuoi: new Date(),
        },
        include: {
          khachHang: { select: { id: true, tenCongTy: true, maKhachHang: true } },
          giaiDoan: true,
          nguoiSoHuu: { select: { id: true, hoTen: true, email: true } },
          nhomKinhDoanh: { select: { id: true, tenNhom: true } },
        },
      }),

      // Story [S6-01]: Ghi nhận lịch sử chuyển giai đoạn
      this.prisma.lichSuChuyenGiaiDoan.create({
        data: {
          coHoiId: id,
          giaiDoanTruocId: coHoi.giaiDoanId,
          giaiDoanSauId: giaiDoanDich.id,
          giaTriTruoc: coHoi.giaTriDuKien,
          giaTriSau: coHoi.giaTriDuKien,
          ngayChotTruoc: coHoi.ngayKyDuKien,
          ngayChotSau: coHoi.ngayKyDuKien,
          lyDoChuyen: dto.lyDoChuyen || (ghiDeDieuKien ? 'Trưởng nhóm ghi đè điều kiện bắt buộc' : null),
          ghiDeDieuKien,
          nguoiThucHienId: currentUser.id,
        },
      }),

      this.prisma.nhatKyHeThong.create({
        data: {
          nguoiThucHienId: currentUser.id,
          loaiDoiTuong: 'CO_HOI',
          doiTuongId: id,
          hanhDong: 'CHUYEN_GIAI_DOAN',
          giaTriTruoc: { giaiDoanId: coHoi.giaiDoanId, tenGiaiDoan: coHoi.giaiDoan.tenGiaiDoan },
          giaTriSau: {
            giaiDoanId: giaiDoanDich.id,
            tenGiaiDoan: giaiDoanDich.tenGiaiDoan,
            ghiDeDieuKien,
          },
        },
      }),
    ]);

    return updated;
  }
}
