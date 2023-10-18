<script type="text/babel">
/**
 * Verify 验证码组件
 * @description 分发验证码使用
 */
import { computed, ref, toRefs, watchEffect } from 'vue'
import VerifySlide from './Verify/VerifySlide.vue'
import VerifyPoints from './Verify/VerifyPoints.vue'
import { useI18n } from '@/hooks/web/useI18n'
import './style/verify.css'

export default {
  name: 'Vue3Verify',
  components: {
    VerifySlide,
    VerifyPoints,
  },
  props: {
    captchaType: {
      type: String,
      required: true,
    },
    figure: {
      type: Number,
    },
    arith: {
      type: Number,
    },
    mode: {
      type: String,
      default: 'pop',
    },
    vSpace: {
      type: Number,
    },
    explain: {
      type: String,
    },
    imgSize: {
      type: Object,
      default() {
        return {
          width: '310px',
          height: '155px',
        }
      },
    },
    blockSize: {
      type: Object,
    },
    barSize: {
      type: Object,
    },
  },
  setup(props) {
    const { t } = useI18n()
    const { captchaType, mode } = toRefs(props)
    const clickShow = ref(false)
    const verifyType = ref(undefined)
    const componentType = ref(undefined)

    const instance = ref({})

    const showBox = computed(() => {
      if (mode.value === 'pop')
        return clickShow.value
      else
        return true
    })
    /**
     * refresh
     * @description 刷新
     */
    const refresh = () => {
      if (instance.value.refresh)
        instance.value.refresh()
    }
    const closeBox = () => {
      clickShow.value = false
      refresh()
    }
    const show = () => {
      if (mode.value === 'pop')
        clickShow.value = true
    }
    watchEffect(() => {
      switch (captchaType.value) {
        case 'blockPuzzle':
          verifyType.value = '2'
          componentType.value = 'VerifySlide'
          break
        case 'clickWord':
          verifyType.value = ''
          componentType.value = 'VerifyPoints'
          break
      }
    })

    return {
      t,
      clickShow,
      verifyType,
      componentType,
      instance,
      showBox,
      closeBox,
      show,
    }
  },
}
</script>

<template>
  <div v-show="showBox" :class="mode === 'pop' ? 'mask' : ''">
    <div :class="mode === 'pop' ? 'verifybox' : ''" :style="{ 'max-width': `${parseInt(imgSize.width) + 20}px` }">
      <div v-if="mode === 'pop'" class="verifybox-top">
        {{ t('component.captcha.verification') }}
        <span class="verifybox-close" @click="closeBox">
          <i class="iconfont icon-close" />
        </span>
      </div>
      <div class="verifybox-bottom" :style="{ padding: mode === 'pop' ? '10px' : '0' }">
        <!-- 验证码容器 -->
        <component
          :is="componentType" v-if="componentType" ref="instance" :captcha-type="captchaType" :type="verifyType"
          :figure="figure" :arith="arith" :mode="mode" :v-space="vSpace" :explain="explain" :img-size="imgSize"
          :block-size="blockSize" :bar-size="barSize"
        />
      </div>
    </div>
  </div>
</template>
