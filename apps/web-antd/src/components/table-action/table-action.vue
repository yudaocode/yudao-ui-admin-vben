<!-- add by 星语：参考 vben2 的方式，增加 TableAction 组件 -->
<script setup lang="ts">
import type { PropType } from 'vue';

import type { ActionItem, PopConfirm } from './typing';

import { computed, toRaw } from 'vue';

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
        type: action.type || 'link',
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

function getPopConfirmProps(attrs: PopConfirm) {
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
}

function getButtonProps(action: ActionItem) {
  const res = {
    type: action.type || 'primary',
    ...action,
  };
  delete res.icon;
  return res;
}

function handleMenuClick(e: any) {
  const action = getDropdownList.value[e.key];
  if (action.onClick && isFunction(action.onClick)) {
    action.onClick();
  }
}
</script>

<template>
  <div class="table-actions">
    <Space
      :size="
        getActions?.some((item: ActionItem) => item.type === 'link') ? 0 : 8
      "
    >
      <template v-for="(action, index) in getActions" :key="index">
        <Popconfirm
          v-if="action.popConfirm"
          v-bind="getPopConfirmProps(action.popConfirm)"
        >
          <template v-if="action.popConfirm.icon" #icon>
            <IconifyIcon :icon="action.popConfirm.icon" />
          </template>
          <Tooltip
            v-bind="
              typeof action.tooltip === 'string'
                ? { title: action.tooltip }
                : { ...action.tooltip }
            "
          >
            <Button v-bind="getButtonProps(action)">
              <template v-if="action.icon" #icon>
                <IconifyIcon :icon="action.icon" />
              </template>
              {{ action.label }}
            </Button>
          </Tooltip>
        </Popconfirm>
        <Tooltip
          v-else
          v-bind="
            typeof action.tooltip === 'string'
              ? { title: action.tooltip }
              : { ...action.tooltip }
          "
        >
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
        <Button :type="getDropdownList[0].type">
          <template #icon>
            {{ $t('page.action.more') }}
            <IconifyIcon icon="lucide:ellipsis-vertical" />
          </template>
        </Button>
      </slot>
      <template #overlay>
        <Menu @click="handleMenuClick">
          <Menu.Item v-for="(action, index) in getDropdownList" :key="index">
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
                  <span class="ml-1">{{ action.text }}</span>
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
