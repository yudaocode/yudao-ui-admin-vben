<script lang="ts" setup>
import { computed, onMounted, ref, unref, useAttrs, useSlots, watch } from 'vue'
import type { TreeProps } from 'ant-design-vue'
import { Tree } from 'ant-design-vue'
import { get } from 'lodash-es'
import type { DataNode } from 'ant-design-vue/es/tree'
import { isArray, isFunction } from '@/utils/is'
import { handleTree as handleTreeFn } from '@/utils/tree'
import { propTypes } from '@/utils/propTypes'
import { useRuleFormItem } from '@/hooks/component/useFormItem'

defineOptions({ name: 'ApiTree' })

const props = defineProps({
  api: { type: Function as PropType<(arg?: Recordable) => Promise<Recordable>> },
  params: { type: Object },
  immediate: propTypes.bool.def(true),
  resultField: propTypes.string.def(''),
  afterFetch: { type: Function as PropType<Fn> },
  handleTree: propTypes.string.def(''),
  alwaysLoad: propTypes.bool.def(true),
  value: {
    type: Array as PropType<TreeProps['selectedKeys']>,
  },
})
const emit = defineEmits(['optionsChange', 'change', 'update:value'])
const attrs = useAttrs()
const slots = useSlots()

const treeData = ref<DataNode[]>([])
const isFirstLoaded = ref<boolean>(false)
const loading = ref(false)
const emitData = ref<any[]>([])
const [state] = useRuleFormItem(props, 'value', 'change', emitData)

const getAttrs = computed(() => {
  return {
    ...(props.api ? { treeData: unref(treeData) } : {}),
    ...attrs,
  }
})

watch(
  () => state.value,
  (v) => {
    emit('update:value', v)
  },
)

watch(
  () => props.params,
  () => {
    if (props.alwaysLoad)
      fetch()

    else
      !unref(isFirstLoaded) && fetch()
  },
  { deep: true },
)

watch(
  () => props.immediate,
  (v) => {
    if (props.alwaysLoad)
      v && fetch()

    else
      v && !isFirstLoaded.value && fetch()
  },
)

onMounted(() => {
  props.immediate && fetch()
})

async function fetch() {
  const { api, afterFetch } = props
  if (!api || !isFunction(api))
    return
  loading.value = true
  treeData.value = []
  let result
  try {
    result = await api(props.params)
  }
  catch (e) {
    console.error(e)
  }
  if (afterFetch && isFunction(afterFetch))
    result = afterFetch(result)

  loading.value = false
  if (!result)
    return
  if (props.handleTree)
    result = handleTreeFn(result, props.handleTree)

  if (!isArray(result))
    result = get(result, props.resultField)

  treeData.value = (result as (Recordable & { key: string | number })[]) || []
  isFirstLoaded.value = true
  emit('optionsChange', treeData.value)
}
</script>

<template>
  <Tree v-bind="getAttrs" v-model:selected-keys="state">
    <template v-for="item in Object.keys(slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
  </Tree>
</template>
