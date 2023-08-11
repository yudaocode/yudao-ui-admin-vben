<script lang="ts" setup>
import { computed, onMounted, ref, unref, useAttrs, watch } from 'vue'
import { TreeSelect } from 'ant-design-vue'
import { get, set } from 'lodash-es'
import { LoadingOutlined } from '@ant-design/icons-vue'
import { isArray, isFunction } from '@/utils/is'
import { propTypes } from '@/utils/propTypes'
import { handleTree as handleTreeFn } from '@/utils/tree'

defineOptions({ name: 'ApiTreeSelect' })

const props = defineProps({
  api: { type: Function as PropType<(arg?: Recordable) => Promise<Recordable>> },
  params: { type: Object },
  immediate: { type: Boolean, default: true },
  resultField: propTypes.string.def(''),
  handleTree: { type: String, default: '' },
  parentId: { type: Number, default: 0 },
  parentLabel: { type: String, default: '' },
  parentFiled: { type: String, default: 'name' },
})
const emit = defineEmits(['optionsChange', 'change'])
const attrs = useAttrs()

const treeData = ref<Recordable[]>([])
const isFirstLoaded = ref<boolean>(false)
const loading = ref(false)
const getAttrs = computed(() => {
  return {
    ...(props.api ? { treeData: unref(treeData) } : {}),
    ...attrs,
  }
})

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

async function fetch() {
  const { api } = props
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
  emit('optionsChange', treeData.value)
}
</script>

<template>
  <TreeSelect v-bind="getAttrs" @change="handleChange">
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
    <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template>
  </TreeSelect>
</template>
