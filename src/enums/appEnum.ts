export const SIDE_BAR_MINI_WIDTH = 48
export const SIDE_BAR_SHOW_TIT_MINI_WIDTH = 80

export enum ContentEnum {
  // auto width
  FULL = 'full',
  // fixed width
  FIXED = 'fixed',
}

// menu theme enum
export enum ThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
}

export enum SettingButtonPositionEnum {
  AUTO = 'auto',
  HEADER = 'header',
  FIXED = 'fixed',
}

export enum SessionTimeoutProcessingEnum {
  ROUTE_JUMP,
  PAGE_COVERAGE,
}

/**
 * 权限模式
 */
export enum PermissionModeEnum {
  // role
  // 角色权限
  ROLE = 'ROLE',
  // black
  // 后端
  BACK = 'BACK',
  // route mapping
  // 路由映射
  ROUTE_MAPPING = 'ROUTE_MAPPING',
}

// Route switching animation
// 路由切换动画
export enum RouterTransitionEnum {
  ZOOM_FADE = 'zoom-fade',
  ZOOM_OUT = 'zoom-out',
  FADE_SIDE = 'fade-slide',
  FADE = 'fade',
  FADE_BOTTOM = 'fade-bottom',
  FADE_SCALE = 'fade-scale',
}

export enum IconEnum {
  VIEW = 'ant-design:file-search-outlined',
  ADD = 'ant-design:plus-outlined',
  IMPORT = 'ant-design:vertical-align-top-outlined',
  EXPORT = 'ant-design:vertical-align-bottom-outlined',
  TEST = 'ant-design:deployment-unit-outlined',
  EDIT = 'clarity:note-edit-line',
  AUTH = 'ant-design:safety-certificate-outlined',
  DATA = 'clarity:note-edit-line',
  DELETE = 'ant-design:delete-outlined',
  SEARCH = 'ant-design:search-outlined',
  RESET = 'ant-design:sync-outlined',
  UPLOAD = 'ant-design:cloud-upload-outlined',
  DOWNLOAD = 'ant-design:cloud-download-outlined',
  PREVIEW = 'ant-design:eye-outlined',
  ADD_FOLD = 'ant-design:folder-add-outlined',
  LOG = 'ant-design:exception-outlined',
  PASSWORD = 'ant-design:key-outlined',
  SETTING = 'ant-design:setting-outlined',
  SEND = 'ant-design:send-outlined',
}
