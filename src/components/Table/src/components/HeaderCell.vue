<script lang="ts" setup>
import { computed } from 'vue'
import type { BasicColumn } from '../types/table'
import EditTableHeaderCell from './EditTableHeaderIcon.vue'
import BasicHelp from '@/components/Basic/src/BasicHelp.vue'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'TableHeaderCell' })

const props = defineProps({
  column: {
    type: Object as PropType<BasicColumn>,
    default: () => ({}),
  },
})

const { prefixCls } = useDesign('basic-table-header-cell')

const getIsEdit = computed(() => !!props.column?.edit)
const getTitle = computed(() => props.column?.customTitle || props.column?.title)
const getHelpMessage = computed(() => props.column?.helpMessage)
</script>

<template>
  <EditTableHeaderCell v-if="getIsEdit">
    {{ getTitle }}
  </EditTableHeaderCell>
  <span v-else>{{ getTitle }}</span>
  <BasicHelp v-if="getHelpMessage" :text="getHelpMessage" :class="`${prefixCls}__help`" />
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-basic-table-header-cell';

.@{prefix-cls} {
  &__help {
    margin-left: 8px;
    color: rgb(0 0 0 / 65%) !important;
  }
}
</style>
