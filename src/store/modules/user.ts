import { h } from 'vue'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import type { ErrorMessageMode } from '@/types/axios'

import { store } from '@/store'
import { router } from '@/router'
import type { RoleEnum } from '@/enums/roleEnum'
import { PageEnum } from '@/enums/pageEnum'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ROLES_KEY, USER_INFO_KEY } from '@/enums/cacheEnum'
import { PAGE_NOT_FOUND_ROUTE } from '@/router/routes/basic'
import { usePermissionStore } from '@/store/modules/permission'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { getAuthCache, setAuthCache } from '@/utils/auth'
import { doLogout, getUserInfo, loginApi, smsLogin } from '@/api/base/user'
import type { GetUserInfoModel, LoginParams, SmsLoginParams } from '@/api/base/model/userModel'

import { isArray } from '@/utils/is'

interface UserState {
  userInfo: Nullable<GetUserInfoModel>
  accessToken?: string
  refreshToken?: string
  roleList: RoleEnum[]
  sessionTimeout?: boolean
  lastUpdateTime: number
}

export const useUserStore = defineStore('app-user', {
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    accessToken: undefined,
    refreshToken: undefined,
    // roleList
    roleList: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
  }),
  getters: {
    getUserInfo(state): GetUserInfoModel {
      return state.userInfo || getAuthCache<GetUserInfoModel>(USER_INFO_KEY) || {}
    },
    getAccessToken(state): string {
      return state.accessToken || getAuthCache<string>(ACCESS_TOKEN_KEY)
    },
    getRefreshToken(state): string {
      return state.refreshToken || getAuthCache<string>(REFRESH_TOKEN_KEY)
    },
    getRoleList(state): RoleEnum[] {
      return state.roleList.length > 0 ? state.roleList : getAuthCache<RoleEnum[]>(ROLES_KEY)
    },
    getSessionTimeout(state): boolean {
      return !!state.sessionTimeout
    },
    getLastUpdateTime(state): number {
      return state.lastUpdateTime
    },
  },
  actions: {
    setAccessToken(info: string | undefined) {
      this.accessToken = info || '' // for null or undefined value
      setAuthCache(ACCESS_TOKEN_KEY, info)
    },
    setRefreshToken(info: string | undefined) {
      this.refreshToken = info || '' // for null or undefined value
      setAuthCache(REFRESH_TOKEN_KEY, info)
    },
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList
      setAuthCache(ROLES_KEY, roleList)
    },
    setUserInfo(info: GetUserInfoModel | null) {
      this.userInfo = info
      this.lastUpdateTime = new Date().getTime()
      setAuthCache(USER_INFO_KEY, info)
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag
    },
    resetState() {
      this.userInfo = null
      this.accessToken = ''
      this.roleList = []
      this.sessionTimeout = false
    },
    /**
     * @description: login
     */
    async login(
      params: LoginParams & {
        goHome?: boolean
        mode?: ErrorMessageMode
      },
    ): Promise<GetUserInfoModel | null> {
      try {
        const { goHome = true, mode, ...loginParams } = params
        const data = await loginApi(loginParams, mode)
        const { accessToken, refreshToken } = data

        // save token
        this.setAccessToken(accessToken)
        this.setRefreshToken(refreshToken)
        return this.afterLoginAction(goHome)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
    async smsLogin(
      params: SmsLoginParams & {
        goHome?: boolean
        mode?: ErrorMessageMode
      },
    ): Promise<GetUserInfoModel | null> {
      try {
        const { goHome = true, mode, ...smsLoginParams } = params
        const data = await smsLogin(smsLoginParams, mode)
        const { accessToken, refreshToken } = data
        // save token
        this.setAccessToken(accessToken)
        this.setRefreshToken(refreshToken)
        return this.afterLoginAction(goHome)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
    async afterLoginAction(goHome?: boolean): Promise<GetUserInfoModel | null> {
      if (!this.getAccessToken)
        return null
      // get user info
      const userInfo = await this.getUserInfoAction()

      const sessionTimeout = this.sessionTimeout
      if (sessionTimeout) {
        this.setSessionTimeout(false)
      }
      else {
        const permissionStore = usePermissionStore()
        if (!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction()
          routes.forEach((route) => {
            try {
              router.addRoute(route as unknown as RouteRecordRaw)
            }
            catch (e) {}
          })
          router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw)
          permissionStore.setDynamicAddedRoute(true)
        }
        goHome && (await router.replace(PageEnum.BASE_HOME))
      }
      return userInfo
    },
    async getUserInfoAction(): Promise<GetUserInfoModel | null> {
      if (!this.getAccessToken)
        return null
      const userInfo = await getUserInfo()
      const { roles = [] } = userInfo
      if (isArray(roles)) {
        const roleList = roles.map(item => item) as RoleEnum[]
        this.setRoleList(roleList)
      }
      else {
        userInfo.roles = []
        this.setRoleList([])
      }
      this.setUserInfo(userInfo)
      return userInfo
    },
    /**
     * @description: logout
     */
    async logout(goLogin = false) {
      if (this.getAccessToken) {
        try {
          await doLogout()
        }
        catch {
          console.log('注销Token失败')
        }
      }
      this.setAccessToken(undefined)
      this.setSessionTimeout(false)
      this.setUserInfo(null)
      goLogin && router.push(PageEnum.BASE_LOGIN)
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut() {
      const { createConfirm } = useMessage()
      const { t } = useI18n()
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          await this.logout(true)
        },
      })
    },
  },
})

// Need to be used outside the setup
export function useUserStoreWithOut() {
  return useUserStore(store)
}
