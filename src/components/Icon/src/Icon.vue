<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, nextTick, onMounted, ref, unref, watch } from 'vue'
import Iconify from '@purge-icons/generated'
import SvgIcon from './SvgIcon.vue'
import { isString } from '@/utils/is'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'Icon' })

const props = defineProps({
  // icon name
  icon: propTypes.string,
  // icon color
  color: propTypes.string,
  // icon size
  size: {
    type: [String, Number] as PropType<string | number>,
    default: 16,
  },
  spin: propTypes.bool.def(false),
  prefix: propTypes.string.def(''),
})

const SVG_END_WITH_FLAG = '|svg'

const elRef = ref<ElRef>(null)

const isSvgIcon = computed(() => props.icon?.endsWith(SVG_END_WITH_FLAG))
const getSvgIcon = computed(() => props.icon.replace(SVG_END_WITH_FLAG, ''))
const getIconRef = computed(() => `${props.prefix ? `${props.prefix}:` : ''}${props.icon}`)

async function update() {
  if (unref(isSvgIcon))
    return

  const el = unref(elRef)
  if (!el)
    return

  await nextTick()
  const icon = unref(getIconRef)
  if (!icon)
    return

  const svg = Iconify.renderSVG(icon, {})
  if (svg) {
    el.textContent = ''
    el.appendChild(svg)
  }
  else {
    const span = document.createElement('span')
    span.className = 'iconify'
    span.dataset.icon = icon
    el.textContent = ''
    el.appendChild(span)
  }
}

const getWrapStyle = computed((): CSSProperties => {
  const { size, color } = props
  let fs = size
  if (isString(size))
    fs = Number.parseInt(size, 10)

  return {
    fontSize: `${fs}px`,
    color,
    display: 'inline-flex',
  }
})

watch(() => props.icon, update, { flush: 'post' })

onMounted(update)
</script>

<template>
  <SvgIcon v-if="isSvgIcon" :size="size" :name="getSvgIcon" class="anticon" :class="[$attrs.class]" :spin="spin" />
  <span v-else ref="elRef" class="app-iconify anticon" :class="[$attrs.class, spin && 'app-iconify-spin']" :style="getWrapStyle" />
</template>

<style lang="less">
.app-iconify {
  display: inline-block;
  // vertical-align: middle;

  &-spin {
    svg {
      animation: loadingCircle 1s infinite linear;
    }
  }
}

span.iconify {
  display: block;
  min-width: 1em;
  min-height: 1em;
  background-color: @iconify-bg-color;
  border-radius: 100%;
}
</style>
