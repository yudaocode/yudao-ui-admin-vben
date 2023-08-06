<script lang="ts" setup>
import { computed, unref } from 'vue'
import type { ColumnChangeParam, TableSetting } from '../../types/table'
import { useTableContext } from '../../hooks/useTableContext'
import ColumnSetting from './ColumnSetting.vue'
import FormSetting from './FormSetting.vue'
import SizeSetting from './SizeSetting.vue'
import RedoSetting from './RedoSetting.vue'
import FullScreenSetting from './FullScreenSetting.vue'

defineOptions({ name: 'TableSetting' })

const props = defineProps({
  setting: {
    type: Object as PropType<TableSetting>,
    default: () => ({}),
  },
})
const emit = defineEmits(['columns-change'])
const table = useTableContext()

const getSetting = computed((): TableSetting => {
  return {
    redo: true,
    form: true,
    size: true,
    setting: true,
    fullScreen: false,
    ...props.setting,
  }
})

function handleColumnChange(data: ColumnChangeParam[]) {
  emit('columns-change', data)
}

function getTableContainer() {
  return table ? unref(table.wrapRef) : document.body
}
</script>

<template>
  <div class="table-settings">
    <RedoSetting v-if="getSetting.redo" :get-popup-container="getTableContainer" />
    <FormSetting v-if="getSetting.form" :get-popup-container="getTableContainer" />
    <SizeSetting v-if="getSetting.size" :get-popup-container="getTableContainer" />
    <ColumnSetting v-if="getSetting.setting" :get-popup-container="getTableContainer" @columns-change="handleColumnChange" />
    <FullScreenSetting v-if="getSetting.fullScreen" :get-popup-container="getTableContainer" />
  </div>
</template>

<style lang="less">
.table-settings {
  & > * {
    margin-right: 12px;
  }

  svg {
    width: 1.3em;
    height: 1.3em;
  }
}
</style>
