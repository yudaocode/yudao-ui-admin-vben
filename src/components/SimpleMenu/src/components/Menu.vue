<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onMounted, provide, ref, watch, watchEffect } from 'vue'
import type { SubMenuProvider } from './types'
import { createSimpleRootMenuContext } from './useSimpleMenuContext'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'
import mitt from '@/utils/mitt'

defineOptions({ name: 'Menu' })

const props = defineProps({
  theme: propTypes.oneOf(['light', 'dark']).def('light'),
  activeName: propTypes.oneOfType([propTypes.string, propTypes.number]),
  openNames: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  accordion: propTypes.bool.def(true),
  width: propTypes.string.def('100%'),
  collapsedWidth: propTypes.string.def('48px'),
  indentSize: propTypes.number.def(16),
  collapse: propTypes.bool.def(true),
  activeSubMenuNames: {
    type: Array as PropType<(string | number)[]>,
    default: () => [],
  },
})
const emit = defineEmits(['select', 'open-change'])

const rootMenuEmitter = mitt()
const instance = getCurrentInstance()

const currentActiveName = ref<string | number>('')
const openedNames = ref<string[]>([])

const { prefixCls } = useDesign('menu')

const isRemoveAllPopup = ref(false)

createSimpleRootMenuContext({
  rootMenuEmitter,
  activeName: currentActiveName,
})

const getClass = computed(() => {
  const { theme } = props
  return [
    prefixCls,
    `${prefixCls}-${theme}`,
    `${prefixCls}-vertical`,
    {
      [`${prefixCls}-collapse`]: props.collapse,
    },
  ]
})

watchEffect(() => {
  openedNames.value = props.openNames
})

watchEffect(() => {
  if (props.activeName)
    currentActiveName.value = props.activeName
})

watch(
  () => props.openNames,
  () => {
    nextTick(() => {
      updateOpened()
    })
  },
)

function updateOpened() {
  rootMenuEmitter.emit('on-update-opened', openedNames.value)
}

function addSubMenu(name: string) {
  if (openedNames.value.includes(name))
    return
  openedNames.value.push(name)
  updateOpened()
}

function removeSubMenu(name: string) {
  openedNames.value = openedNames.value.filter(item => item !== name)
  updateOpened()
}

function removeAll() {
  openedNames.value = []
  updateOpened()
}

function sliceIndex(index: number) {
  if (index === -1)
    return
  openedNames.value = openedNames.value.slice(0, index + 1)
  updateOpened()
}

provide<SubMenuProvider>(`subMenu:${instance?.uid}`, {
  addSubMenu,
  removeSubMenu,
  getOpenNames: () => openedNames.value,
  removeAll,
  isRemoveAllPopup,
  sliceIndex,
  level: 0,
  props: props as any,
})

onMounted(() => {
  openedNames.value = !props.collapse ? [...props.openNames] : []
  updateOpened()
  rootMenuEmitter.on('on-menu-item-select', (name: string) => {
    currentActiveName.value = name

    nextTick(() => {
      props.collapse && removeAll()
    })
    emit('select', name)
  })

  rootMenuEmitter.on('open-name-change', ({ name, opened }) => {
    if (opened && !openedNames.value.includes(name)) {
      openedNames.value.push(name)
    }
    else if (!opened) {
      const index = openedNames.value.findIndex(item => item === name)
      index !== -1 && openedNames.value.splice(index, 1)
    }
  })
})
</script>

<template>
  <ul :class="getClass">
    <slot />
  </ul>
</template>

<style lang="less">
@import './menu.less';
</style>
