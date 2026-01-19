import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * 로그인 요청 DTO
 */
export class LoginRequestDto {
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력해주세요' })
  memberId: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력해주세요' })
  @MinLength(1, { message: '비밀번호를 입력해주세요' })
  password: string;
}

/**
 * 로그인 응답 DTO
 */
export class LoginResponseDto {
  accessToken: string;
  user: {
    memberId: string;
    name: string;
    farmNo: number;
    farmNm: string;
    memberType: string;
    email?: string;
    lang?: string;
  };
}

/**
 * JWT 페이로드 인터페이스
 */
export interface JwtPayload {
  memberId: string;
  farmNo: number;
  farmNm: string;
  name: string;
  memberType: string;
  lang: string; // 언어코드 (ko/en/vi)
}
