<script lang="ts" setup>
import { computed, ref, unref, useAttrs, watch, watchEffect } from 'vue'
import { Transfer } from 'ant-design-vue'
import { get, omit } from 'lodash-es'
import type { TransferDirection, TransferItem } from 'ant-design-vue/lib/transfer'
import { isFunction } from '@/utils/is'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ApiTransfer' })

const props = defineProps({
  value: { type: Array as PropType<Array<any>> },
  api: {
    type: Function as PropType<(arg?: Recordable) => Promise<TransferItem[]>>,
    default: null,
  },
  params: { type: Object },
  dataSource: { type: Array as PropType<Array<TransferItem>> },
  immediate: propTypes.bool.def(true),
  alwaysLoad: propTypes.bool.def(false),
  afterFetch: { type: Function as PropType<Fn> },
  resultField: propTypes.string.def(''),
  labelField: propTypes.string.def('title'),
  valueField: propTypes.string.def('key'),
  showSearch: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  filterOption: {
    type: Function as PropType<(inputValue: string, item: TransferItem) => boolean>,
  },
  selectedKeys: { type: Array as PropType<Array<string>> },
  showSelectAll: { type: Boolean, default: true },
  targetKeys: { type: Array as PropType<Array<string>> },
})
const emit = defineEmits(['optionsChange', 'change'])
const attrs = useAttrs()

const _dataSource = ref<TransferItem[]>([])
const _targetKeys = ref<string[]>([])
const getAttrs = computed(() => {
  return {
    ...(!props.api ? { dataSource: unref(_dataSource) } : {}),
    ...attrs,
  }
})
const getdataSource = computed(() => {
  const { labelField, valueField } = props
  return unref(_dataSource).reduce((prev, next: Recordable) => {
    if (next) {
      prev.push({
        ...omit(next, [labelField, valueField]),
        title: next[labelField],
        key: next[valueField],
      })
    }
    return prev
  }, [] as TransferItem[])
})
const getTargetKeys = computed<string[]>(() => {
  if (unref(_targetKeys).length > 0)
    return unref(_targetKeys)

  if (Array.isArray(props.value))
    return props.value

  if (Array.isArray(props.targetKeys))
    return props.targetKeys

  return []
})
function handleChange(keys: string[], direction: TransferDirection, moveKeys: string[]) {
  _targetKeys.value = keys
  console.log(direction)
  console.log(moveKeys)
  emit('change', keys)
}
watchEffect(() => {
  props.immediate && !props.alwaysLoad && fetch()
})
watch(
  () => props.params,
  () => {
    fetch()
  },
  { deep: true },
)
async function fetch() {
  const api = props.api
  if (!api || !isFunction(api)) {
    if (Array.isArray(props.dataSource))
      _dataSource.value = props.dataSource

    return
  }
  _dataSource.value = []
  try {
    const res = await api(props.params)
    if (Array.isArray(res)) {
      _dataSource.value = res
      emitChange()
      return
    }
    if (props.resultField)
      _dataSource.value = get(res, props.resultField) || []

    emitChange()
  }
  catch (error) {
    console.warn(error)
  }
}
function emitChange() {
  emit('optionsChange', unref(getdataSource))
}
</script>

<template>
  <Transfer
    v-bind="getAttrs"
    :data-source="getdataSource"
    :filter-option="filterOption"
    :render="(item) => item.title"
    :show-select-all="showSelectAll"
    :selected-keys="selectedKeys"
    :target-keys="getTargetKeys"
    :show-search="showSearch"
    @change="handleChange"
  />
</template>
