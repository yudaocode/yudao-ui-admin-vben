<script setup lang="ts">
import type { ButtonType } from 'ant-design-vue/es/button';

import type { ActionItem, PopConfirm } from './types';

import { computed, type PropType, toRaw } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { isBoolean, isFunction } from '@vben/utils';

import { Button, Dropdown, Menu, Popconfirm, Space } from 'ant-design-vue';

defineOptions({
  name: 'ActionButtons',
});

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

const MenuItem = Menu.Item;

const { hasAccessByCodes } = useAccess();
function isIfShow(action: ActionItem): boolean {
  const ifShow = action.ifShow;

  let isIfShow = true;

  if (isBoolean(ifShow)) {
    isIfShow = ifShow;
  }
  if (isFunction(ifShow)) {
    isIfShow = ifShow(action);
  }
  return isIfShow;
}

const getActions = computed(() => {
  return (toRaw(props.actions) || [])
    .filter((action) => {
      return (
        (hasAccessByCodes(action.auth || []) ||
          (action.auth || []).length === 0) &&
        isIfShow(action)
      );
    })
    .map((action) => {
      const { popConfirm } = action;
      return {
        // getPopupContainer: document.body,
        type: 'default' as ButtonType,
        ...action,
        ...popConfirm,
        onConfirm: popConfirm?.confirm,
        onCancel: popConfirm?.cancel,
        enable: !!popConfirm,
      };
    });
});
const getDropdownList = computed((): any[] => {
  return (toRaw(props.dropDownActions) || [])
    .filter((action) => {
      return (
        (hasAccessByCodes(action.auth || []) ||
          (action.auth || []).length === 0) &&
        isIfShow(action)
      );
    })
    .map((action, index) => {
      const { label, popConfirm } = action;
      return {
        ...action,
        ...popConfirm,
        onConfirm: popConfirm?.confirm,
        onCancel: popConfirm?.cancel,
        text: label,
        divider:
          index < props.dropDownActions.length - 1 ? props.divider : false,
      };
    });
});
const getPopConfirmProps = (attrs: PopConfirm) => {
  const originAttrs: any = attrs;
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
};
const getButtonProps = (action: ActionItem) => {
  const res = {
    type: action.type || 'primary',
    ...action,
  };
  delete res.icon;
  return res;
};
const handleMenuClick = (e: any) => {
  const action = getDropdownList.value[e.key];
  if (action.onClick && isFunction(action.onClick)) {
    action.onClick();
  }
};
</script>

<template>
  <div class="m-table-action w-fit">
    <Space :size="2">
      <template v-for="(action, index) in getActions" :key="index">
        <Popconfirm
          v-if="action.popConfirm"
          :disabled="action.disabled"
          v-bind="getPopConfirmProps(action.popConfirm)"
        >
          <template v-if="action.popConfirm.icon" #icon>
            <IconifyIcon :icon="action.popConfirm.icon" />
          </template>
          <Button v-bind="getButtonProps(action)">
            <template v-if="action.icon" #icon>
              <IconifyIcon :icon="action.icon" />
            </template>
            {{ action.label }}
          </Button>
        </Popconfirm>
        <Button v-else v-bind="getButtonProps(action)" @click="action.onClick">
          <template v-if="action.icon" #icon>
            <IconifyIcon :icon="action.icon" />
          </template>
          {{ action.label }}
        </Button>
      </template>
    </Space>

    <Dropdown v-if="getDropdownList.length > 0" :trigger="['hover']">
      <slot name="more">
        <Button size="large" type="link">
          <template #icon>
            <IconifyIcon icon="mdi:more-horiz" />
          </template>
        </Button>
      </slot>
      <template #overlay>
        <Menu class="w-full" @click="handleMenuClick">
          <MenuItem v-for="(action, index) in getDropdownList" :key="index">
            <template v-if="action.popConfirm">
              <Popconfirm v-bind="getPopConfirmProps(action.popConfirm)">
                <template v-if="action.popConfirm.icon" #icon>
                  <IconifyIcon :icon="action.popConfirm.icon" />
                </template>
                <div class="flex items-center">
                  <IconifyIcon v-if="action.icon" :icon="action.icon" />
                  <span class="ml-1">{{ action.text }}</span>
                </div>
              </Popconfirm>
            </template>
            <template v-else>
              <div class="flex items-center">
                <IconifyIcon v-if="action.icon" :icon="action.icon" />
                <span class="ml-1">{{ action.text }}</span>
              </div>
            </template>
          </MenuItem>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>
<style lang="less">
/** 修复 iconify 位置问题 **/
.m-table-action {
  .ant-btn > .iconify + span,
  .ant-btn > span + .iconify {
    margin-inline-start: 4px;
  }

  .ant-btn > .iconify {
    display: inline-flex;
    align-items: center;
    width: 1em;
    height: 1em;
    font-style: normal;
    line-height: 0;
    color: inherit;
    text-align: center;
    text-transform: none;
    vertical-align: -0.125em;
    text-rendering: optimizelegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /** 修复 link 按钮的样式问题 */
  .ant-btn-link {
    padding: 0;
  }
}
</style>
