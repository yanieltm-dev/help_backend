import type { AuthenticatedRequestUser } from '@/modules/auth/infrastructure/security/jwt.strategy';
import { ConfirmUploadUseCase } from '@/modules/media/application/use-cases/confirm-upload.use-case';
import { GeneratePresignedUrlUseCase } from '@/modules/media/application/use-cases/generate-presigned-url.use-case';
import { UploadFileUseCase } from '@/modules/media/application/use-cases/upload-file.use-case';
import { CurrentAuth, JwtAuthGuard } from '@/shared/auth';
import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteFileUseCase } from '../../../application/use-cases/delete-file.use-case';
import { ConfirmUploadDto } from '../dtos/requests/confirm-upload.dto';
import { GeneratePresignedUrlDto } from '../dtos/requests/generate-presigned-url.dto';
import { DeleteMediaResponseDto } from '../dtos/responses/delete-media.response.dto';
import { MediaFileResponseDto } from '../dtos/responses/media-file.response.dto';
import { PresignedUrlResponseDto } from '../dtos/responses/presigned-url.response.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly generatePresignedUrlUseCase: GeneratePresignedUrlUseCase,
    private readonly confirmUploadUseCase: ConfirmUploadUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Directly upload a file',
    description:
      'Uploads a file directly to the backend using multipart form data. The file is validated for size and type before being sent to storage.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: MediaFileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentAuth() auth: AuthenticatedRequestUser,
  ): Promise<MediaFileResponseDto> {
    const result = await this.uploadFileUseCase.execute({
      file: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      ownerId: auth.userId,
    });
    return result;
  }

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate a presigned URL for upload',
    description:
      'Provides a URL for clients to upload files directly to storage (S3/R2). After successful upload, the client must call /media/upload/confirm.',
  })
  @ApiResponse({
    status: 201,
    type: PresignedUrlResponseDto,
    description: 'URL generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generatePresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
    @CurrentAuth() auth: AuthenticatedRequestUser,
  ): Promise<PresignedUrlResponseDto> {
    return this.generatePresignedUrlUseCase.execute({
      ...dto,
      ownerId: auth.userId,
    });
  }

  @Post('upload/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm a file upload (indirect flow)',
    description:
      'Registers a file in the system after it has been uploaded to storage via a presigned URL. This step creates the Media record in the database.',
  })
  @ApiResponse({
    status: 201,
    description: 'File confirmed and registered successfully',
    type: MediaFileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentAuth() auth: AuthenticatedRequestUser,
  ): Promise<MediaFileResponseDto> {
    return this.confirmUploadUseCase.execute({
      ...dto,
      ownerId: auth.userId,
    });
  }

  @Delete(':fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a file',
    description:
      'Permanently deletes a file from the repository and the physical storage. Only the owner of the file can delete it.',
  })
  @ApiResponse({
    status: 200,
    description: 'File successfully deleted',
    type: DeleteMediaResponseDto,
  })
  @ApiResponse({ status: 401, description: 'User is not authenticated' })
  @ApiResponse({
    status: 403,
    description: 'User is not the owner of the requested file',
  })
  @ApiResponse({
    status: 404,
    description: 'File with the specified ID was not found',
  })
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentAuth() auth: AuthenticatedRequestUser,
  ): Promise<DeleteMediaResponseDto> {
    await this.deleteFileUseCase.execute({
      fileId,
      requesterId: auth.userId,
    });
    return { success: true };
  }
}
