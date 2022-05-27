import {
  Body,
  Res,
  Req,
  HttpStatus,
  Param,
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { Schema as MongoSchema, Connection, Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { LogInUserDto } from './dto/loginUser.dto';
import { JwtGuard } from './jwt/guards/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../config/multer.config';

@Controller('users')
export class UsersController {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Get()
  // @UseGuards(JwtGuard)
  async getAllUsers(@Res() res: Response) {
    const users = await this.usersService.getAllUsers();
    return res.status(HttpStatus.OK).json(users);
  }

  @Get('/:user_name')
  async getUserByUserName(
    @Param('user_name') user_name: string,
    @Res() res: Response,
  ) {
    // console.log(request.user);
    try {
      const user = await this.usersService.getUserByUserName(user_name);
      return res.status(HttpStatus.OK).json({
        errorCode: 0,
        message: 'Lấy Thông Tin Người Dùng Thành Công !',
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        following_count: user.following_count,
        follwer_count: user.follwer_count,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        errorCode: 1,
        message: 'Người Dùng Không Tồn Tại !',
      });
    }
  }

  @Post('/auth/signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    // console.log(createUserDto);
    try {
      const user = await this.usersService.createUser(createUserDto, session);
      await session.commitTransaction();
      return res.status(HttpStatus.OK).json(user);
    } catch {
      await session.abortTransaction();
      throw new Error();
    } finally {
      session.endSession();
    }
  }

  @Post('/auth/signin')
  async signIn(@Body() logInUserDto: LogInUserDto, @Res() res: Response) {
    try {
      const token = await this.usersService.login(logInUserDto);
      const tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 1);
      res.header('Authorization', token.accessToken);
      res.cookie('refreshToken', token.refreshToken, {
        expires: tomorrow,
        sameSite: 'strict',
        secure: false,
        httpOnly: true,
      });
      const { userId } = this.jwtService.verify(token.accessToken);

      const user = await this.usersService.getUserById(userId);
      // console.log(user);
      return res.status(HttpStatus.OK).json({
        errorCode: 0,
        message: 'Đăng Nhập Thành Công !',
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        userName: user.userName,
        following_count: user.following_count,
        follwer_count: user.follwer_count,
        avatar: user.avatar,
        accessToken: token.accessToken,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        errorCode: 1,
        message: 'Sai Thông Tin Đăng Nhập !',
      });
    }
  }
  @Post('/auth/refresh')
  async refreshToken(@Req() request, @Res() res: Response) {
    let refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'no token' });
    }
    const { user_id } = this.jwtService.verify(refreshToken);
    const user: any = await this.usersService.getUserById(user_id);
    const payload = { email: user.email, user_id: user._id };
    const token = await this.jwtService.sign(payload, { expiresIn: '30s' });
    // console.log(user);
    // refreshToken = user.refreshToken;

    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);

    res.header('Authorization', token);
    res.cookie('refreshToken', refreshToken, {
      expires: tomorrow,
      sameSite: 'strict',
      secure: false,
      httpOnly: true,
    });
    return res.status(HttpStatus.OK).json({ accessToken: token });
  }

  @Post('/auth/logout')
  @UseGuards(JwtGuard)
  async logOut(@Req() request, @Res() res: Response) {
    try {
      res.clearCookie('refreshToken');
      return res
        .status(HttpStatus.OK)
        .json({ errorCode: 0, message: 'Đăng Xuất Thành Công !' });
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ errorCode: 1, message: 'Đăng Xuất Thất Bại !' });
    }
  }

  @Patch('/:id')
  @UseGuards(JwtGuard)
  async updateUser(
    @Param('id') id: Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.usersService.updateUser(
        id,
        updateUserDto,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).json({
        errorCode: 0,
        message: 'Cập Nhật Thông Tin Người Dùng Thành Công !',
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        following_count: user.following_count,
        follwer_count: user.follwer_count,
      });
    } catch {
      await session.abortTransaction();
      return res.status(HttpStatus.BAD_REQUEST).json({
        errorCode: 1,
        message: 'Cập Nhật Thông Tin Người Dùng Thất Bại !',
      });
    } finally {
      session.endSession();
    }
  }

  @Patch('/upload/:user_id')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async uploadAvatar(
    @Param('user_id') user_id: Types.ObjectId,
    @UploadedFile() avatar,
    @Res() res: Response,
  ) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const avatarHash = avatar.filename;
      const user = await this.usersService.updateAvatar(
        user_id,
        avatarHash,
        session,
      );
      await session.commitTransaction();
      return res.status(HttpStatus.OK).json({
        errorCode: 0,
        message: 'Cập Nhật Avatar Thành Công !',
        avatar: user.avatar,
      });
    } catch {
      await session.abortTransaction();
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ errorCode: 1, message: 'Cập Nhật Avatar Thất Bại !' });
    } finally {
      session.endSession();
    }
  }

  @Delete('/:id')
  @UseGuards(JwtGuard)
  async deleteUser(@Param('id') id: Types.ObjectId, @Res() res: Response) {
    const session = await this.mongoConnection.startSession();
    session.startTransaction();
    try {
      const user = await this.usersService.deleteUser(id, session);
      await session.commitTransaction();
      return res
        .status(HttpStatus.OK)
        .json({ data: user, message: 'Xóa Người Dùng Thành Công !' });
    } catch {
      await session.abortTransaction();
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Xóa Người Dùng Thất Bại !' });
    } finally {
      session.endSession();
    }
  }
}
