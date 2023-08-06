<script lang="ts" setup>
import { computed, getCurrentInstance, ref, unref, useSlots, watch } from 'vue'
import { Tooltip } from 'ant-design-vue'
import { useMenuItem } from './useMenu'
import { useSimpleRootMenuContext } from './useSimpleMenuContext'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'MenuItem' })

const props = defineProps({
  name: {
    type: [String, Number] as PropType<string | number>,
    required: true,
  },
  disabled: propTypes.bool,
})
const slots = useSlots()

const instance = getCurrentInstance()

const active = ref(false)

const { getItemStyle, getParentList, getParentMenu, getParentRootMenu } = useMenuItem(instance)

const { prefixCls } = useDesign('menu')

const { rootMenuEmitter, activeName } = useSimpleRootMenuContext()

const getClass = computed(() => {
  return [
    `${prefixCls}-item`,
    {
      [`${prefixCls}-item-active`]: unref(active),
      [`${prefixCls}-item-selected`]: unref(active),
      [`${prefixCls}-item-disabled`]: !!props.disabled,
    },
  ]
})

const getCollapse = computed(() => unref(getParentRootMenu)?.props.collapse)

const showToptip = computed(() => {
  return unref(getParentMenu)?.type.name === 'Menu' && unref(getCollapse) && slots.title
})

function handleClickItem() {
  const { disabled } = props
  if (disabled)
    return

  rootMenuEmitter.emit('on-menu-item-select', props.name)
  if (unref(getCollapse))
    return

  const { uidList } = getParentList()

  rootMenuEmitter.emit('on-update-opened', {
    opend: false,
    parent: instance?.parent,
    uidList,
  })
}
watch(
  () => activeName.value,
  (name: string) => {
    if (name === props.name) {
      const { list, uidList } = getParentList()
      active.value = true
      list.forEach((item) => {
        if (item.proxy) {
          ;(item.proxy as any).active = true
        }
      })

      rootMenuEmitter.emit('on-update-active-name:submenu', uidList)
    }
    else {
      active.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <li :class="getClass" :style="getCollapse ? {} : getItemStyle" @click.stop="handleClickItem">
    <Tooltip v-if="showToptip" placement="right">
      <template #title>
        <slot name="title" />
      </template>
      <div :class="`${prefixCls}-tooltip`">
        <slot />
      </div>
    </Tooltip>

    <template v-else>
      <slot />
      <slot name="title" />
    </template>
  </li>
</template>
