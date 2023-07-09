import { PartialType } from '@nestjs/mapped-types';
import { CreatePixDto } from './create-pix.dto';

export class UpdatePixDto extends PartialType(CreatePixDto) {}
