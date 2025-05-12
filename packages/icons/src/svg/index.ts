import { createIconifyIcon } from '@vben-core/icons';

import './load.js';

const SvgAvatar1Icon = createIconifyIcon('svg:avatar-1');
const SvgAvatar2Icon = createIconifyIcon('svg:avatar-2');
const SvgAvatar3Icon = createIconifyIcon('svg:avatar-3');
const SvgAvatar4Icon = createIconifyIcon('svg:avatar-4');
const SvgDownloadIcon = createIconifyIcon('svg:download');
const SvgCardIcon = createIconifyIcon('svg:card');
const SvgBellIcon = createIconifyIcon('svg:bell');
const SvgCakeIcon = createIconifyIcon('svg:cake');
const SvgAntdvLogoIcon = createIconifyIcon('svg:antdv-logo');

// bpm 图标
// TODO @ziye：这个看看，是不是拿到 bpm 模块里，不放在这里；因为有些团队，用不到 bpm 哈
const SvgBpmRunningIcon = createIconifyIcon('svg:bpm-running');
const SvgBpmApproveIcon = createIconifyIcon('svg:bpm-approve');
const SvgBpmRejectIcon = createIconifyIcon('svg:bpm-reject');
const SvgBpmCancelIcon = createIconifyIcon('svg:bpm-cancel');

export {
  SvgAntdvLogoIcon,
  SvgAvatar1Icon,
  SvgAvatar2Icon,
  SvgAvatar3Icon,
  SvgAvatar4Icon,
  SvgBellIcon,
  SvgBpmApproveIcon,
  SvgBpmCancelIcon,
  SvgBpmRejectIcon,
  SvgBpmRunningIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
};
