<script lang="ts" setup>
import { computed, ref, unref, watch, watchEffect } from 'vue'
import { Select } from 'ant-design-vue'
import { get, omit } from 'lodash-es'
import { LoadingOutlined } from '@ant-design/icons-vue'
import type { SelectValue } from 'ant-design-vue/lib/select'
import { isFunction } from '@/utils/is'
import { useRuleFormItem } from '@/hooks/component/useFormItem'
import { useI18n } from '@/hooks/web/useI18n'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ApiSelect', inheritAttrs: false })

const props = defineProps({
  value: {
    type: [Array, Object, String, Number] as PropType<SelectValue>,
  },
  numberToString: propTypes.bool,
  api: {
    type: Function as PropType<(arg?: Recordable) => Promise<OptionsItem[]>>,
    default: null,
  },
  // api params
  params: {
    type: Object as PropType<Recordable>,
    default: () => ({}),
  },
  // support xxx.xxx.xx
  resultField: propTypes.string.def(''),
  labelField: propTypes.string.def('label'),
  valueField: propTypes.string.def('value'),
  immediate: propTypes.bool.def(true),
  alwaysLoad: propTypes.bool.def(false),
})

const emit = defineEmits(['optionsChange', 'change', 'update:value'])

interface OptionsItem { label: string; value: string; disabled?: boolean }

const options = ref<OptionsItem[]>([])
const loading = ref(false)
const isFirstLoad = ref(true)
const emitData = ref<any[]>([])
const { t } = useI18n()

// Embedded in the form, just use the hook binding to perform form verification
const [state] = useRuleFormItem(props, 'value', 'change', emitData)

const getOptions = computed(() => {
  const { labelField, valueField, numberToString } = props

  return unref(options).reduce((prev, next: Recordable) => {
    if (next) {
      const value = get(next, valueField)
      prev.push({
        ...omit(next, [labelField, valueField]),
        label: get(next, labelField),
        value: numberToString ? `${value}` : value,
      })
    }
    return prev
  }, [] as OptionsItem[])
})

watchEffect(() => {
  props.immediate && !props.alwaysLoad && fetch()
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
    !unref(isFirstLoad) && fetch()
  },
  { deep: true },
)

async function fetch() {
  const api = props.api
  if (!api || !isFunction(api))
    return
  options.value = []
  try {
    loading.value = true
    const res = await api(props.params)
    if (Array.isArray(res)) {
      options.value = res
      emitChange()
      return
    }
    if (props.resultField)
      options.value = get(res, props.resultField) || []

    emitChange()
  }
  catch (error) {
    console.warn(error)
  }
  finally {
    loading.value = false
  }
}

async function handleFetch(open) {
  if (open) {
    if (props.alwaysLoad) {
      await fetch()
    }
    else if (!props.immediate && unref(isFirstLoad)) {
      await fetch()
      isFirstLoad.value = false
    }
  }
}

function emitChange() {
  emit('optionsChange', unref(getOptions))
}

function handleChange(_, ...args) {
  emitData.value = args
}
</script>

<template>
  <Select v-bind="$attrs" v-model:value="state" :options="getOptions" @dropdown-open-change="handleFetch" @change="handleChange">
    <template v-for="item in Object.keys($slots)" #[item]="data">
      <slot :name="item" v-bind="data || {}" />
    </template>
    <template v-if="loading" #suffixIcon>
      <LoadingOutlined spin />
    </template>
    <template v-if="loading" #notFoundContent>
      <span>
        <LoadingOutlined spin class="mr-1" />
        {{ t('component.form.apiSelectNotFound') }}
      </span>
    </template>
  </Select>
</template>
