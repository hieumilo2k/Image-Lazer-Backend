import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';

export type PostDocument = Document & Post;

Schema({ timestamps: true });
export class Post {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongoSchema.Types.ObjectId;

  @Prop({ required: true })
  photo_url: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  website: string;

  @Prop({ required: true })
  tags: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
