import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VaiTroEnum, PhamViDuLieuEnum } from '../enums/role.enum';

@Injectable()
export class DataScopeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Xác định phạm vi dữ liệu dựa trên danh sách vai trò người dùng
   */
  xacDinhPhamVi(roles: string[]): PhamViDuLieuEnum {
    if (roles.includes(VaiTroEnum.ADMIN) || roles.includes(VaiTroEnum.DIRECTOR)) {
      return PhamViDuLieuEnum.ALL_DATA;
    }
    if (roles.includes(VaiTroEnum.TEAM_LEAD)) {
      return PhamViDuLieuEnum.TEAM_DATA;
    }
    return PhamViDuLieuEnum.MY_DATA;
  }

  /**
   * Lấy danh sách ID người dùng mà người gọi được phép xem dữ liệu
   */
  async layDanhSachNguoiDungDuocXem(user: any): Promise<string[] | null> {
    const roles: string[] = user.roles || [];
    const phamVi = this.xacDinhPhamVi(roles);

    if (phamVi === PhamViDuLieuEnum.ALL_DATA) {
      return null; // Không giới hạn (xem toàn bộ)
    }

    if (phamVi === PhamViDuLieuEnum.TEAM_DATA) {
      // Tìm nhóm mà user đang là trưởng nhóm hoặc thuộc về
      let nhomIds: string[] = [];
      if (user.nhomKinhDoanhId) {
        nhomIds.push(user.nhomKinhDoanhId);
        // Lấy các nhóm con (đệ quy 1 cấp)
        const subTeams = await this.prisma.nhomKinhDoanh.findMany({
          where: { nhomChaId: user.nhomKinhDoanhId },
          select: { id: true },
        });
        nhomIds.push(...subTeams.map((t) => t.id));
      }

      // Lấy toàn bộ user thuộc các nhóm này
      const members = await this.prisma.nguoiDung.findMany({
        where: { nhomKinhDoanhId: { in: nhomIds } },
        select: { id: true },
      });

      const memberIds = members.map((m) => m.id);
      if (!memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }
      return memberIds;
    }

    // MY_DATA: chỉ xem dữ liệu của chính mình
    return [user.id];
  }
}
