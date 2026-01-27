import { PartialType } from '@nestjs/mapped-types';
import { CreateSparePartLogDto } from './create-spare_part_log.dto';

export class UpdateSparePartLogDto extends PartialType(CreateSparePartLogDto) {}
