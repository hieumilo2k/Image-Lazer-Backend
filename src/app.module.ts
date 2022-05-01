import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { AlbumsModule } from './albums/albums.module';
import { SavePostsModule } from './savePosts/saveposts.module';
import { FollowsModule } from './follows/follows.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    CommentsModule,
    PostsModule,
    LikesModule,
    AlbumsModule,
    SavePostsModule,
    FollowsModule,
  ],
})
export class AppModule {}
