<script lang="ts" setup>
import { computed, onMounted, ref, unref, useAttrs, useSlots, watch } from 'vue'
import { Tree } from 'ant-design-vue'
import { get } from 'lodash-es'
import { isArray, isFunction } from '@/utils/is'
import { handleTree as handleTreeFn } from '@/utils/tree'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ApiTree' })

const props = defineProps({
  api: { type: Function as PropType<(arg?: Recordable) => Promise<Recordable>> },
  params: { type: Object },
  immediate: { type: Boolean, default: true },
  resultField: propTypes.string.def(''),
  afterFetch: { type: Function as PropType<Fn> },
  handleTree: { type: String, default: '' },
})
const emit = defineEmits(['optionsChange', 'change'])
const attrs = useAttrs()
const slots = useSlots()

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

  treeData.value = (result as Recordable[]) || []
  isFirstLoaded.value = true
  emit('optionsChange', treeData.value)
}
</script>

<template>
  <Tree v-bind="getAttrs as any" @change="handleChange">
    <template v-for="item in Object.keys(slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
    <!-- <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template> -->
  </Tree>
</template>
