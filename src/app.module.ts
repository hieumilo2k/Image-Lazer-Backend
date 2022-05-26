import { CommentsGateway } from './comments/comments.gateway';
import { ConfigModule } from './config/config.module';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { AlbumsModule } from './albums/albums.module';
import { SavePostsModule } from './savePosts/saveposts.module';
import { FollowsModule } from './follows/follows.module';
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from './config/config.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getMongoConfig(),
    }),
    UsersModule,
    CommentsModule,
    FollowsModule,
    PostsModule,
    LikesModule,
    AlbumsModule,
    SavePostsModule,
    ChatModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
