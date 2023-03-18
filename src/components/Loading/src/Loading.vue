<template>
  <section
    class="full-loading"
    :class="{ absolute, [theme]: !!theme }"
    :style="[background ? `background-color: ${background}` : '']"
    v-show="loading"
  >
    <Spin v-bind="$attrs" :tip="tip" :size="size" :spinning="loading" />
  </section>
</template>
<script lang="ts" setup name="Loading">
import { Spin } from 'ant-design-vue'
import { SizeEnum } from '@/enums/sizeEnum'
import { propTypes } from '@/utils/propTypes'

defineProps({
  tip: propTypes.string.def(''),
  size: {
    type: String as PropType<SizeEnum>,
    default: SizeEnum.LARGE,
    validator: (v: SizeEnum): boolean => {
      return [SizeEnum.DEFAULT, SizeEnum.SMALL, SizeEnum.LARGE].includes(v)
    }
  },
  absolute: propTypes.bool.def(false),
  loading: propTypes.bool.def(false),
  background: propTypes.string,
  theme: propTypes.oneOf(['dark', 'light']).def('light')
})
</script>
<style lang="less" scoped>
.full-loading {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: rgb(240 242 245 / 40%);

  &.absolute {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 300;
  }
}

html[data-theme='dark'] {
  .full-loading:not(.light) {
    background-color: @modal-mask-bg;
  }
}

.full-loading.dark {
  background-color: @modal-mask-bg;
}
</style>
