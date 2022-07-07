import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Schema as MongoSchema, Types } from 'mongoose';

export class DeletePostOfAlbumDto {
  @IsOptional()
  @IsNotEmpty()
  post_id: Types.ObjectId;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  album: string;
}
