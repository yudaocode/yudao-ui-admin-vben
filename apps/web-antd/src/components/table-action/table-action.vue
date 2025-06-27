<!-- add by 星语：参考 vben2 的方式，增加 TableAction 组件 -->
<script setup lang="ts">
import type { PropType } from 'vue';

import type { ActionItem, PopConfirm } from './typing';

import { computed, ref, toRaw, unref, watchEffect } from 'vue';

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

/** 缓存处理后的 actions */
const processedActions = ref<any[]>([]);
const processedDropdownActions = ref<any[]>([]);

/** 用于比较的字符串化版本 */
const actionsStringField = ref('');
const dropdownActionsStringField = ref('');

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

/** 处理 actions 的纯函数 */
function processActions(actions: ActionItem[]): any[] {
  return actions
    .filter((action: ActionItem) => {
      return isIfShow(action);
    })
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
}

/** 处理下拉菜单 actions 的纯函数 */
function processDropdownActions(
  dropDownActions: ActionItem[],
  divider: boolean,
): any[] {
  return dropDownActions
    .filter((action: ActionItem) => {
      return isIfShow(action);
    })
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
        divider: index < dropDownActions.length - 1 ? divider : false,
      };
    });
}

/** 监听 actions 变化并更新缓存 */
watchEffect(() => {
  const rawActions = toRaw(props.actions) || [];
  const currentStringField = JSON.stringify(
    rawActions.map((a) => ({
      ...a,
      onClick: undefined, // 排除函数以便比较
      popConfirm: a.popConfirm
        ? { ...a.popConfirm, confirm: undefined, cancel: undefined }
        : undefined,
    })),
  );

  if (currentStringField !== actionsStringField.value) {
    actionsStringField.value = currentStringField;
    processedActions.value = processActions(rawActions);
  }
});

/** 监听 dropDownActions 变化并更新缓存 */
watchEffect(() => {
  const rawDropDownActions = toRaw(props.dropDownActions) || [];
  const currentStringField = JSON.stringify({
    actions: rawDropDownActions.map((a) => ({
      ...a,
      onClick: undefined, // 排除函数以便比较
      popConfirm: a.popConfirm
        ? { ...a.popConfirm, confirm: undefined, cancel: undefined }
        : undefined,
    })),
    divider: props.divider,
  });

  if (currentStringField !== dropdownActionsStringField.value) {
    dropdownActionsStringField.value = currentStringField;
    processedDropdownActions.value = processDropdownActions(
      rawDropDownActions,
      props.divider,
    );
  }
});

const getActions = computed(() => processedActions.value);

const getDropdownList = computed(() => processedDropdownActions.value);

/** 缓存 Space 组件的 size 计算结果 */
const spaceSize = computed(() => {
  return unref(getActions)?.some((item: ActionItem) => item.type === 'link')
    ? 0
    : 8;
});

/** 缓存 PopConfirm 属性 */
const popConfirmPropsMap = new Map<string, any>();

function getPopConfirmProps(attrs: PopConfirm) {
  const key = JSON.stringify({
    title: attrs.title,
    okText: attrs.okText,
    cancelText: attrs.cancelText,
    disabled: attrs.disabled,
  });

  if (popConfirmPropsMap.has(key)) {
    return popConfirmPropsMap.get(key);
  }

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

  popConfirmPropsMap.set(key, originAttrs);
  return originAttrs;
}

/** 缓存 Button 属性 */
const buttonPropsMap = new Map<string, any>();

function getButtonProps(action: ActionItem) {
  const key = JSON.stringify({
    type: action.type,
    danger: action.danger || false,
    disabled: action.disabled,
    loading: action.loading,
    size: action.size,
  });

  if (buttonPropsMap.has(key)) {
    return { ...buttonPropsMap.get(key) };
  }

  const res = {
    type: action.type || 'link',
    danger: action.danger || false,
    disabled: action.disabled,
    loading: action.loading,
    size: action.size,
  };

  buttonPropsMap.set(key, res);
  return res;
}

/** 缓存 Tooltip 属性 */
const tooltipPropsMap = new Map<string, any>();

function getTooltipProps(tooltip: any | string) {
  if (!tooltip) return {};

  const key = typeof tooltip === 'string' ? tooltip : JSON.stringify(tooltip);

  if (tooltipPropsMap.has(key)) {
    return tooltipPropsMap.get(key);
  }

  const result =
    typeof tooltip === 'string' ? { title: tooltip } : { ...tooltip };

  tooltipPropsMap.set(key, result);
  return result;
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
    <Space :size="spaceSize">
      <template v-for="(action, index) in getActions">
        <Popconfirm
          v-if="action.popConfirm"
          v-bind="getPopConfirmProps(action.popConfirm)"
          :key="getActionKey(action, index)"
        >
          <template v-if="action.popConfirm.icon" #icon>
            <IconifyIcon :icon="action.popConfirm.icon" />
          </template>
          <Tooltip
            v-bind="getTooltipProps(action.tooltip)"
            :key="getActionKey(action, index)"
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
          v-bind="getTooltipProps(action.tooltip)"
          :key="`tooltip-${getActionKey(action, index)}`"
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
