<script lang="ts" setup>
import { computed, onMounted, ref, unref, useAttrs, watch } from 'vue'
import { TreeSelect } from 'ant-design-vue'
import { get, set } from 'lodash-es'
import { LoadingOutlined } from '@ant-design/icons-vue'
import { isArray, isFunction } from '@/utils/is'
import { propTypes } from '@/utils/propTypes'
import type { Recordable } from '@/utils/types'
import { handleTree as handleTreeFn } from '@/utils/tree'

defineOptions({ name: 'ApiTreeSelect' })

const props = defineProps({
  api: { type: Function as PropType<(arg?: Recordable<any>) => Promise<Recordable<any>>> },
  params: { type: Object },
  immediate: propTypes.bool.def(true),
  async: propTypes.bool.def(false),
  resultField: propTypes.string.def(''),
  handleTree: propTypes.string.def(''),
  parentId: propTypes.number.def(0),
  parentLabel: propTypes.string.def(''),
  parentFiled: propTypes.string.def('name'),
  labelField: propTypes.string.def('name'),
  valueField: propTypes.string.def('id'),
  childrenField: propTypes.string.def('children'),
})
const emit = defineEmits(['options-change', 'change', 'load-data'])
const attrs = useAttrs()
const treeData = ref<Recordable<any>[]>([])
const isFirstLoaded = ref<boolean>(false)
const loading = ref(false)
const getAttrs = computed(() => {
  return {
    ...(props.api ? { treeData: unref(treeData) } : {}),
    ...attrs,
  }
})
const fieldNames = {
  children: props.childrenField,
  value: props.valueField,
  label: props.labelField,
}

function handleChange(...args) {
  emit('change', ...args)
}

watch(
  () => props.params,
  () => {
    !unref(isFirstLoaded) && fetch()
  },
  { deep: true },
)

watch(
  () => props.immediate,
  (v) => {
    v && !isFirstLoaded.value && fetch()
  },
)

onMounted(() => {
  props.immediate && fetch()
})

function onLoadData(treeNode) {
  return new Promise((resolve: (value?: unknown) => void) => {
    if (isArray(treeNode.children) && treeNode.children.length > 0) {
      resolve()
      return
    }
    emit('load-data', { treeData, treeNode, resolve })
  })
}

async function fetch() {
  const { api } = props
  if (!api || !isFunction(api) || loading.value)
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
  loading.value = false
  if (!result)
    return
  if (!isArray(result))
    result = get(result, props.resultField)

  if (props.handleTree)
    result = handleTreeFn(result, props.handleTree)

  if (props.parentLabel) {
    let tree: Recordable = { id: props.parentId, children: [] }
    tree = set(tree, props.parentFiled, props.parentLabel)
    tree.children = (result as Recordable[]) || []
    treeData.value.push(tree)
  }
  else {
    treeData.value = (result as Recordable[]) || []
  }
  isFirstLoaded.value = true
  emit('options-change', treeData.value)
}
</script>

<template>
  <TreeSelect
    v-bind="getAttrs"
    :field-names="fieldNames"
    :load-data="async ? onLoadData : undefined"
    @change="handleChange"
  >
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
    <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template>
  </TreeSelect>
</template>
