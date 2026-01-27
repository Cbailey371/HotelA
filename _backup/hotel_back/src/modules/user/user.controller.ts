import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import ApiOkBaseResponse from '@decorators/api-ok-base-response.decorator';
import { SkipAuth } from '@modules/auth/guards/skip-auth.guard';
import { CustomWherePipe } from '@providers/custom-where.pipe';
import { Prisma } from '@prisma/client';
import CustomOrderByPipe from '@providers/custom-order-by.pipe';
import { utils, write } from 'xlsx';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @SkipAuth()
  @ApiCreatedResponse({ type: UserEntity })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({
    name: 'where',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: 'string',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiOkBaseResponse({ dto: UserEntity, isArray: true, meta: true })
  findAll(
    @Query('where', CustomWherePipe) where?: Prisma.UserWhereInput,
    @Query('orderBy', CustomOrderByPipe)
    orderBy?: Prisma.UserOrderByWithRelationInput,
    @Query('page')
    page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.userService.findAll(where, orderBy, page, perPage);
  }

  @Get('download')
  @Header('Content-Disposition', 'attachment; filename="data.xlsx"')
  async download(): Promise<StreamableFile> {
    const { data } = await this.userService.findAll({}, {}, 1, 10000);

    var exportData = data.map((item) => [
      `${item.name || 'No aplica'}`,
      `${item.email || 'No aplica'}`,
    ]);

    exportData.unshift(['Nombre completo', 'Correo electrónico']);

    const ws = utils.aoa_to_sheet(exportData as any);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new StreamableFile(buf);
  }

  @Get(':id')
  @ApiCreatedResponse({ type: UserEntity })
  findOne(@Param('id') id: string) {
    return this.userService.findOne({ where: { id: id } });
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: UserEntity })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiExcludeEndpoint()
  @ApiCreatedResponse({ type: UserEntity })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
