<!-- add by 星语：参考 vben2 的方式，增加 TableAction 组件 -->
<script setup lang="ts">
import type { PropType } from 'vue';

import type { ActionItem, PopConfirm } from './typing';

import { computed, unref } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { isBoolean, isFunction } from '@vben/utils';

import {
  Button,
  Dropdown,
  Menu,
  Popconfirm,
  Space,
  Tooltip,
} from 'ant-design-vue';

const props = defineProps({
  actions: {
    type: Array as PropType<ActionItem[]>,
    default() {
      return [];
    },
  },
  dropDownActions: {
    type: Array as PropType<ActionItem[]>,
    default() {
      return [];
    },
  },
  divider: {
    type: Boolean,
    default: true,
  },
});

const { hasAccessByCodes } = useAccess();

/** 检查是否显示 */
function isIfShow(action: ActionItem): boolean {
  const ifShow = action.ifShow;
  let isIfShow = true;
  if (isBoolean(ifShow)) {
    isIfShow = ifShow;
  }
  if (isFunction(ifShow)) {
    isIfShow = ifShow(action);
  }
  if (isIfShow) {
    isIfShow =
      hasAccessByCodes(action.auth || []) || (action.auth || []).length === 0;
  }
  return isIfShow;
}

/** 处理按钮 actions */
const getActions = computed(() => {
  return (props.actions || [])
    .filter((action: ActionItem) => isIfShow(action))
    .map((action: ActionItem) => {
      const { popConfirm } = action;
      return {
        type: action.type || 'link',
        ...action,
        ...popConfirm,
        onConfirm: popConfirm?.confirm,
        onCancel: popConfirm?.cancel,
        enable: !!popConfirm,
      };
    });
});

/** 处理下拉菜单 actions */
const getDropdownList = computed(() => {
  return (props.dropDownActions || [])
    .filter((action: ActionItem) => isIfShow(action))
    .map((action: ActionItem, index: number) => {
      const { label, popConfirm } = action;
      const processedAction = { ...action };
      delete processedAction.icon;
      return {
        ...processedAction,
        ...popConfirm,
        onConfirm: popConfirm?.confirm,
        onCancel: popConfirm?.cancel,
        text: label,
        divider:
          index < props.dropDownActions.length - 1 ? props.divider : false,
      };
    });
});

/** Space 组件的 size */
const spaceSize = computed(() => {
  return unref(getActions)?.some((item: ActionItem) => item.type === 'link')
    ? 0
    : 8;
});

/** 获取 PopConfirm 属性 */
function getPopConfirmProps(attrs: PopConfirm) {
  const originAttrs: any = { ...attrs };
  delete originAttrs.icon;
  if (attrs.confirm && isFunction(attrs.confirm)) {
    originAttrs.onConfirm = attrs.confirm;
    delete originAttrs.confirm;
  }
  if (attrs.cancel && isFunction(attrs.cancel)) {
    originAttrs.onCancel = attrs.cancel;
    delete originAttrs.cancel;
  }
  return originAttrs;
}

/** 获取 Button 属性 */
function getButtonProps(action: ActionItem) {
  return {
    type: action.type || 'link',
    danger: action.danger || false,
    disabled: action.disabled,
    loading: action.loading,
    size: action.size,
  };
}

/** 获取 Tooltip 属性 */
function getTooltipProps(tooltip: any | string) {
  if (!tooltip) return {};
  return typeof tooltip === 'string' ? { title: tooltip } : { ...tooltip };
}

/** 处理菜单点击 */
function handleMenuClick(e: any) {
  const action = getDropdownList.value[e.key];
  if (action && action.onClick && isFunction(action.onClick)) {
    action.onClick();
  }
}

/** 生成稳定的 key */
function getActionKey(action: ActionItem, index: number) {
  return `${action.label || ''}-${action.type || ''}-${index}`;
}
</script>

<template>
  <div class="table-actions">
    <Space :size="spaceSize">
      <template
        v-for="(action, index) in getActions"
        :key="getActionKey(action, index)"
      >
        <Popconfirm
          v-if="action.popConfirm"
          v-bind="getPopConfirmProps(action.popConfirm)"
        >
          <template v-if="action.popConfirm.icon" #icon>
            <IconifyIcon :icon="action.popConfirm.icon" />
          </template>
          <Tooltip v-bind="getTooltipProps(action.tooltip)">
            <Button v-bind="getButtonProps(action)">
              <template v-if="action.icon" #icon>
                <IconifyIcon :icon="action.icon" />
              </template>
              {{ action.label }}
            </Button>
          </Tooltip>
        </Popconfirm>
        <Tooltip v-else v-bind="getTooltipProps(action.tooltip)">
          <Button v-bind="getButtonProps(action)" @click="action.onClick">
            <template v-if="action.icon" #icon>
              <IconifyIcon :icon="action.icon" />
            </template>
            {{ action.label }}
          </Button>
        </Tooltip>
      </template>
    </Space>

    <Dropdown v-if="getDropdownList.length > 0" :trigger="['hover']">
      <slot name="more">
        <Button :type="getDropdownList[0]?.type">
          <template #icon>
            {{ $t('page.action.more') }}
            <IconifyIcon icon="lucide:ellipsis-vertical" />
          </template>
        </Button>
      </slot>
      <template #overlay>
        <Menu>
          <Menu.Item
            v-for="(action, index) in getDropdownList"
            :key="index"
            :disabled="action.disabled"
            @click="!action.popConfirm && handleMenuClick({ key: index })"
          >
            <template v-if="action.popConfirm">
              <Popconfirm v-bind="getPopConfirmProps(action.popConfirm)">
                <template v-if="action.popConfirm.icon" #icon>
                  <IconifyIcon :icon="action.popConfirm.icon" />
                </template>
                <div
                  :class="
                    action.disabled === true
                      ? 'cursor-not-allowed text-gray-300'
                      : ''
                  "
                >
                  <IconifyIcon v-if="action.icon" :icon="action.icon" />
                  <span :class="action.icon ? 'ml-1' : ''">
                    {{ action.text }}
                  </span>
                </div>
              </Popconfirm>
            </template>
            <template v-else>
              <div
                :class="
                  action.disabled === true
                    ? 'cursor-not-allowed text-gray-300'
                    : ''
                "
              >
                <IconifyIcon v-if="action.icon" :icon="action.icon" />
                {{ action.label }}
              </div>
            </template>
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>

<style lang="scss">
.table-actions {
  .ant-btn-link {
    padding: 4px;
    margin-left: 0;
  }

  .ant-btn > .iconify + span,
  .ant-btn > span + .iconify {
    margin-inline-start: 4px;
  }

  .iconify {
    display: inline-flex;
    align-items: center;
    width: 1em;
    height: 1em;
    font-style: normal;
    line-height: 0;
    vertical-align: -0.125em;
    color: inherit;
    text-align: center;
    text-transform: none;
    text-rendering: optimizelegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

.ant-popconfirm {
  .ant-popconfirm-buttons {
    .ant-btn {
      margin-inline-start: 4px !important;
    }
  }
}
</style>
