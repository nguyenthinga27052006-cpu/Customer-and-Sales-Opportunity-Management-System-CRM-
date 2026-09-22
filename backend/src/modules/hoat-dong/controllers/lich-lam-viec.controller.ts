import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { LichLamViecService } from '../services/lich-lam-viec.service';

@ApiTags('Lịch làm việc (Calendar - EP-06 S6-07)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lich-lam-viec')
export class LichLamViecController {
  constructor(private readonly lichService: LichLamViecService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy lịch làm việc cá nhân & nhóm kết hợp Cuộc gặp và Công việc (S6-07)' })
  async layLichLamViec(
    @Query('tuNgay') tuNgay?: string,
    @Query('denNgay') denNgay?: string,
    @Query('xemTeam') xemTeam?: string,
    @Query('nguoiDungId') nguoiDungId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.lichService.layLichLamViec(
      {
        tuNgay,
        denNgay,
        xemTeam: xemTeam === 'true',
        nguoiDungId,
      },
      user,
    );
  }
}
