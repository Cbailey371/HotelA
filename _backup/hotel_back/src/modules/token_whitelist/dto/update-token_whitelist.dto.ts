import { PartialType } from '@nestjs/mapped-types';
import { CreateTokenWhitelistDto } from './create-token_whitelist.dto';

export class UpdateTokenWhitelistDto extends PartialType(CreateTokenWhitelistDto) {}
