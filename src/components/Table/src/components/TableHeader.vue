<script lang="ts" setup>
import { Divider } from 'ant-design-vue'
import type { ColumnChangeParam, TableSetting } from '../types/table'
import TableSettingComponent from './settings/index.vue'
import TableTitle from './TableTitle.vue'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'BasicTableHeader' })

defineProps({
  title: {
    type: [Function, String] as PropType<string | ((data: Recordable) => string)>,
  },
  tableSetting: {
    type: Object as PropType<TableSetting>,
  },
  showTableSetting: {
    type: Boolean,
  },
  titleHelpMessage: {
    type: [String, Array] as PropType<string | string[]>,
    default: '',
  },
})
const emit = defineEmits(['columns-change'])

const { prefixCls } = useDesign('basic-table-header')
function handleColumnChange(data: ColumnChangeParam[]) {
  emit('columns-change', data)
}
</script>

<template>
  <div style="width: 100%">
    <div v-if="$slots.headerTop" style="margin: 5px">
      <slot name="headerTop" />
    </div>
    <div class="flex items-center">
      <slot v-if="$slots.tableTitle" name="tableTitle" />
      <TableTitle v-if="!$slots.tableTitle && title" :help-message="titleHelpMessage" :title="title" />
      <div :class="`${prefixCls}__toolbar`">
        <slot name="toolbar" />
        <Divider v-if="$slots.toolbar && showTableSetting" type="vertical" />
        <TableSettingComponent v-if="showTableSetting" :setting="tableSetting" @columns-change="handleColumnChange" />
      </div>
    </div>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-basic-table-header';

.@{prefix-cls} {
  &__toolbar {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
    padding-top: 10px;

    > * {
      margin-right: 8px;
    }
  }
}
</style>
