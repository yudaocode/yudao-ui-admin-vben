<script lang="ts" setup>
import { computed, toRaw, unref } from 'vue'
import { DownOutlined } from '@ant-design/icons-vue'
import type { TooltipProps } from 'ant-design-vue'
import { Divider, Tooltip } from 'ant-design-vue'
import { useTableContext } from '../hooks/useTableContext'
import { ACTION_COLUMN_FLAG } from '../const'
import { useI18n } from '@/hooks/web/useI18n'
import { Icon } from '@/components/Icon'
import type { ActionItem, TableActionType } from '@/components/Table'
import { PopConfirmButton } from '@/components/Button'
import { Dropdown } from '@/components/Dropdown'
import { useDesign } from '@/hooks/web/useDesign'
import { usePermission } from '@/hooks/web/usePermission'
import { isBoolean, isFunction, isString } from '@/utils/is'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'TableAction' })

const props = defineProps({
  actions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  dropDownActions: {
    type: Array as PropType<ActionItem[]>,
    default: null,
  },
  divider: propTypes.bool.def(true),
  outside: propTypes.bool,
  stopButtonPropagation: propTypes.bool.def(false),
})

const { t } = useI18n()
const { prefixCls } = useDesign('basic-table-action')
let table: Partial<TableActionType> = {}
if (!props.outside)
  table = useTableContext()

const { hasPermission } = usePermission()
function isIfShow(action: ActionItem): boolean {
  const ifShow = action.ifShow

  let isIfShow = true

  if (isBoolean(ifShow))
    isIfShow = ifShow

  if (isFunction(ifShow))
    isIfShow = ifShow(action)

  return isIfShow
}

const getActions = computed(() => {
  return (toRaw(props.actions) || [])
    .filter((action) => {
      return hasPermission(action.auth) && isIfShow(action)
    })
    .map((action) => {
      const { popConfirm } = action
      return {
        getPopupContainer: () => unref((table as any)?.wrapRef.value) ?? document.body,
        type: 'link',
        ...action,
        ...(popConfirm || {}),
        onConfirm: popConfirm?.confirm,
        onCancel: popConfirm?.cancel,
        enable: !!popConfirm,
      }
    })
})

const getDropdownList = computed((): any[] => {
  const list = (toRaw(props.dropDownActions) || []).filter((action) => {
    return hasPermission(action.auth) && isIfShow(action)
  })
  return list.map((action, index) => {
    const { label, popConfirm } = action
    return {
      ...action,
      ...popConfirm,
      onConfirm: popConfirm?.confirm,
      onCancel: popConfirm?.cancel,
      text: label,
      divider: index < list.length - 1 ? props.divider : false,
    }
  })
})

const getAlign = computed(() => {
  const columns = (table as TableActionType)?.getColumns?.() || []
  const actionColumn = columns.find(item => item.flag === ACTION_COLUMN_FLAG)
  return actionColumn?.align ?? 'left'
})

function getTooltip(data: string | TooltipProps): TooltipProps {
  return {
    getPopupContainer: () => unref((table as any)?.wrapRef.value) ?? document.body,
    placement: 'bottom',
    ...(isString(data) ? { title: data } : data),
  }
}

function onCellClick(e: MouseEvent) {
  if (!props.stopButtonPropagation)
    return
  const path = e.composedPath() as HTMLElement[]
  const isInButton = path.find((ele) => {
    return ele.tagName?.toUpperCase() === 'BUTTON'
  })
  isInButton && e.stopPropagation()
}
</script>

<template>
  <div :class="[prefixCls, getAlign]" @click="onCellClick">
    <template v-for="(action, index) in getActions" :key="`${index}-${action.label}`">
      <Tooltip v-if="action.tooltip" v-bind="getTooltip(action.tooltip)">
        <PopConfirmButton v-bind="action">
          <Icon v-if="action.icon" :icon="action.icon" :class="{ 'mr-1': !!action.label }" />
          <template v-if="action.label">
            {{ action.label }}
          </template>
        </PopConfirmButton>
      </Tooltip>
      <PopConfirmButton v-else v-bind="action">
        <Icon v-if="action.icon" :icon="action.icon" :class="{ 'mr-1': !!action.label }" />
        <template v-if="action.label">
          {{ action.label }}
        </template>
      </PopConfirmButton>
      <Divider v-if="divider && index < getActions.length - 1" type="vertical" class="action-divider" />
    </template>
    <Dropdown v-if="dropDownActions && getDropdownList.length > 0" :trigger="['hover']" :drop-menu-list="getDropdownList" popconfirm>
      <slot name="more" />
      <a-button v-if="!$slots.more" type="link">
        {{ t('action.more') }} <DownOutlined class="icon-more" />
      </a-button>
    </Dropdown>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-basic-table-action';

.@{prefix-cls} {
  display: flex;
  align-items: center;

  .action-divider {
    display: table;
  }

  &.left {
    justify-content: flex-start;
  }

  &.center {
    justify-content: center;
  }

  &.right {
    justify-content: flex-end;
  }

  button {
    display: flex;
    align-items: center;

    span {
      margin-left: 0 !important;
    }
  }

  button.ant-btn-circle {
    span {
      margin: auto !important;
    }
  }

  .ant-btn-link {
    padding: 8px 4px;
    margin-left: 0;
  }

  .ant-divider,
  .ant-divider-vertical {
    margin: 0 2px;
  }

  .icon-more {
    margin-left: 0.25rem;

    svg {
      font-size: 1.1em;
      font-weight: 700;
    }
  }
}
</style>
