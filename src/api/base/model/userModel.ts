/**
 * @description: Login interface parameters
 */
export interface LoginParams {
  username: string
  password: string
  captchaVerification: string
}

/**
 * @description: Login interface return value
 */
export interface LoginResultModel {
  userId: string | number
  accessToken: string
  refreshToken: string
  expiresTime: number
}

/**
 * @description: Get user information return value
 */
export interface GetUserInfoModel {
  roles: string[]
  permissions: string[]
  // 用户id
  user: userModel
}

export interface userModel {
  id: string | number
  avatar: string
  nickname: string
}
