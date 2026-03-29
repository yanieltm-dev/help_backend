import { GetMeUseCase } from '@/modules/users/application/use-cases/get-me.use-case';
import { UpdateProfileUseCase } from '@/modules/users/application/use-cases/update-profile.use-case';
import {
  CurrentAuth,
  JwtAuthGuard,
  type AuthenticatedUser,
} from '@/shared/auth';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateProfileDto } from '../dto/requests/update-profile.dto';
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

  @Patch('me')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async updateMe(
    @CurrentAuth() auth: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<MeResponseDto> {
    await this.updateProfileUseCase.execute({
      userId: auth.userId,
      username: dto.userName,
      displayName: dto.displayName,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      avatarUrl: dto.avatarUrl,
    });

    return this.getMeUseCase.execute({ userId: auth.userId });
  }
}
