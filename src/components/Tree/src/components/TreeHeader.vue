<script lang="ts" setup>
import { computed, ref, useSlots, watch } from 'vue'
import { Dropdown, InputSearch, Menu, MenuDivider } from 'ant-design-vue'
import { useDebounceFn } from '@vueuse/core'
import { ToolbarEnum } from '../types/tree'
import { Icon } from '@/components/Icon'
import { BasicTitle } from '@/components/Basic'
import { useI18n } from '@/hooks/web/useI18n'
import { createBEM } from '@/utils/bem'

const props = defineProps({
  helpMessage: {
    type: [String, Array] as PropType<string | string[]>,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  toolbar: {
    type: Boolean,
    default: false,
  },
  // 是否显示toolbar的 层级关联/层级独立按钮
  showStrictlyButton: {
    type: Boolean,
    default: true,
  },
  checkable: {
    type: Boolean,
    default: false,
  },
  search: {
    type: Boolean,
    default: false,
  },
  searchText: {
    type: String,
    default: '',
  },
  checkAll: {
    type: Function,
    default: undefined,
  },
  expandAll: {
    type: Function,
    default: undefined,
  },
} as const)

const emit = defineEmits(['strictly-change', 'search'])

const searchValue = ref('')

const [bem] = createBEM('tree-header')

const slots = useSlots()
const { t } = useI18n()

const getInputSearchCls = computed(() => {
  const titleExists = slots.headerTitle || props.title
  return [
    'mr-1',
    'w-full',
    {
      'ml-5': titleExists,
    },
  ]
})

const toolbarList = computed(() => {
  const { checkable, showStrictlyButton } = props
  const defaultToolbarList = [
    { label: t('component.tree.expandAll'), value: ToolbarEnum.EXPAND_ALL },
    {
      label: t('component.tree.unExpandAll'),
      value: ToolbarEnum.UN_EXPAND_ALL,
      divider: checkable,
    },
  ]

  const retList = [
    {
      label: t('component.tree.selectAll'),
      value: ToolbarEnum.SELECT_ALL,
    },
    {
      label: t('component.tree.unSelectAll'),
      value: ToolbarEnum.UN_SELECT_ALL,
      divider: checkable,
    },
    ...defaultToolbarList,
  ]
  if (showStrictlyButton) {
    retList.push(
      ...[
        {
          label: t('component.tree.checkStrictly'),
          value: ToolbarEnum.CHECK_STRICTLY,
        },
        {
          label: t('component.tree.checkUnStrictly'),
          value: ToolbarEnum.CHECK_UN_STRICTLY,
        },
      ],
    )
  }
  return checkable ? retList : defaultToolbarList
})

function handleMenuClick(e) {
  const { key } = e
  switch (key) {
    case ToolbarEnum.SELECT_ALL:
      props.checkAll?.(true)
      break
    case ToolbarEnum.UN_SELECT_ALL:
      props.checkAll?.(false)
      break
    case ToolbarEnum.EXPAND_ALL:
      props.expandAll?.(true)
      break
    case ToolbarEnum.UN_EXPAND_ALL:
      props.expandAll?.(false)
      break
    case ToolbarEnum.CHECK_STRICTLY:
      emit('strictly-change', false)
      break
    case ToolbarEnum.CHECK_UN_STRICTLY:
      emit('strictly-change', true)
      break
  }
}

function emitChange(value?: string): void {
  emit('search', value)
}

const debounceEmitChange = useDebounceFn(emitChange, 200)

watch(
  () => searchValue.value,
  (v) => {
    debounceEmitChange(v)
  },
)

watch(
  () => props.searchText,
  (v) => {
    if (v !== searchValue.value)
      searchValue.value = v
  },
)
</script>

<template>
  <div :class="bem()" class="flex px-2 py-1.5 items-center">
    <slot v-if="slots.headerTitle" name="headerTitle" />
    <BasicTitle v-if="!slots.headerTitle && title" :help-message="helpMessage">
      {{ title }}
    </BasicTitle>
    <div v-if="search || toolbar" class="flex items-center flex-1 cursor-pointer justify-self-stretch">
      <div v-if="search" :class="getInputSearchCls">
        <InputSearch v-model:value="searchValue" :placeholder="t('common.searchText')" allow-clear />
      </div>
      <Dropdown v-if="toolbar" @click.prevent>
        <Icon icon="ion:ellipsis-vertical" />
        <template #overlay>
          <Menu @click="handleMenuClick">
            <template v-for="item in toolbarList" :key="item.value">
              <Menu.Item v-bind="{ key: item.value }">
                {{ item.label }}
              </Menu.Item>
              <MenuDivider v-if="item.divider" />
            </template>
          </Menu>
        </template>
      </Dropdown>
    </div>
  </div>
</template>
