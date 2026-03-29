import { GetMeUseCase } from '@/modules/users/application/use-cases/get-me.use-case';
import { UpdateProfileUseCase } from '@/modules/users/application/use-cases/update-profile.use-case';
import {
  CurrentAuth,
  JwtAuthGuard,
  type AuthenticatedUser,
} from '@/shared/auth';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MeResponseDto } from '../dto/responses/me.response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @Get('me')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentAuth() auth: AuthenticatedUser): Promise<MeResponseDto> {
    return this.getMeUseCase.execute({ userId: auth.userId });
  }
}
