<script type="text/babel" setup>
/**
 * VerifySlide
 * @description 滑块
 */
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { aesEncrypt } from './../utils/ase'
import { resetSize } from './../utils/util'
import { checkCaptcha, getCaptcha } from '@/api/base/login'
import { useI18n } from '@/hooks/web/useI18n'

const props = defineProps({
  captchaType: {
    type: String,
  },
  type: {
    type: String,
    default: '1',
  },
  // 弹出式pop，固定fixed
  mode: {
    type: String,
    default: 'fixed',
  },
  vSpace: {
    type: Number,
    default: 5,
  },
  explain: {
    type: String,
    default: '',
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
    default() {
      return {
        width: '50px',
        height: '50px',
      }
    },
  },
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '30px',
      }
    },
  },
})

const { t } = useI18n()
const { mode, captchaType, type, blockSize, explain } = toRefs(props)
const { proxy } = getCurrentInstance()
const secretKey = ref('') // 后端返回的ase加密秘钥
const passFlag = ref('') // 是否通过的标识
const backImgBase = ref('') // 验证码背景图片
const blockBackImgBase = ref('') // 验证滑块的背景图片
const backToken = ref('') // 后端返回的唯一token值
const startMoveTime = ref('') // 移动开始的时间
const endMovetime = ref('') // 移动结束的时间
const tipWords = ref('')
const text = ref('')
const finishText = ref('')
const setSize = reactive({
  imgHeight: 0,
  imgWidth: 0,
  barHeight: 0,
  barWidth: 0,
})
const moveBlockLeft = ref(undefined)
const leftBarWidth = ref(undefined)
// 移动中样式
const moveBlockBackgroundColor = ref(undefined)
const leftBarBorderColor = ref('#ddd')
const iconColor = ref(undefined)
const iconClass = ref('icon-right')
const status = ref(false) // 鼠标状态
const isEnd = ref(false) // 是够验证完成
const showRefresh = ref(true)
const transitionLeft = ref('')
const transitionWidth = ref('')
const startLeft = ref(0)

const barArea = computed(() => {
  return proxy.$el.querySelector('.verify-bar-area')
})
function init() {
  if (explain.value === '')
    text.value = t('component.captcha.slide')
  else
    text.value = explain.value

  getPictrue()
  nextTick(() => {
    const { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy)
    setSize.imgHeight = imgHeight
    setSize.imgWidth = imgWidth
    setSize.barHeight = barHeight
    setSize.barWidth = barWidth
    proxy.$parent.$emit('ready', proxy)
  })

  window.removeEventListener('touchmove', (e) => {
    move(e)
  })
  window.removeEventListener('mousemove', (e) => {
    move(e)
  })

  // 鼠标松开
  window.removeEventListener('touchend', () => {
    end()
  })
  window.removeEventListener('mouseup', () => {
    end()
  })

  window.addEventListener('touchmove', (e) => {
    move(e)
  })
  window.addEventListener('mousemove', (e) => {
    move(e)
  })

  // 鼠标松开
  window.addEventListener('touchend', () => {
    end()
  })
  window.addEventListener('mouseup', () => {
    end()
  })
}
watch(type, () => {
  init()
})
onMounted(() => {
  // 禁止拖拽
  init()
  proxy.$el.onselectstart = function () {
    return false
  }
})
// 鼠标按下
function start(e) {
  e = e || window.event
  let x
  if (!e.touches) {
    // 兼容PC端
    x = e.clientX
  }
  else {
    // 兼容移动端
    x = e.touches[0].pageX
  }
  startLeft.value = Math.floor(x - barArea.value.getBoundingClientRect().left)
  startMoveTime.value = +new Date() // 开始滑动的时间
  if (isEnd.value === false) {
    text.value = ''
    moveBlockBackgroundColor.value = '#337ab7'
    leftBarBorderColor.value = '#337AB7'
    iconColor.value = '#fff'
    e.stopPropagation()
    status.value = true
  }
}
// 鼠标移动
function move(e) {
  e = e || window.event
  let x
  if (status.value && isEnd.value === false) {
    if (!e.touches) {
      // 兼容PC端
      x = e.clientX
    }
    else {
      // 兼容移动端
      x = e.touches[0].pageX
    }
    const bar_area_left = barArea.value.getBoundingClientRect().left
    let move_block_left = x - bar_area_left // 小方块相对于父元素的left值
    if (move_block_left >= barArea.value.offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2)
      move_block_left = barArea.value.offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2

    if (move_block_left <= 0)
      move_block_left = Number.parseInt(Number.parseInt(blockSize.value.width) / 2)

    // 拖动后小方块的left值
    moveBlockLeft.value = `${move_block_left - startLeft.value}px`
    leftBarWidth.value = `${move_block_left - startLeft.value}px`
  }
}

// 鼠标松开
function end() {
  endMovetime.value = +new Date()
  // 判断是否重合
  if (status.value && isEnd.value === false) {
    let moveLeftDistance = Number.parseInt((moveBlockLeft.value || 0))
    moveLeftDistance = (moveLeftDistance * 310) / Number.parseInt(setSize.imgWidth)
    const data = {
      captchaType: captchaType.value,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey.value)
        : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
      token: backToken.value,
    }
    checkCaptcha(data).then((response) => {
      const res = response.data
      if (res.repCode === '0000') {
        moveBlockBackgroundColor.value = '#5cb85c'
        leftBarBorderColor.value = '#5cb85c'
        iconColor.value = '#fff'
        iconClass.value = 'icon-check'
        showRefresh.value = false
        isEnd.value = true
        if (mode.value === 'pop') {
          setTimeout(() => {
            proxy.$parent.clickShow = false
            refresh()
          }, 1500)
        }
        passFlag.value = true
        tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s
            ${t('component.captcha.success')}`
        const captchaVerification = secretKey.value
          ? aesEncrypt(`${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`, secretKey.value)
          : `${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`
        setTimeout(() => {
          tipWords.value = ''
          proxy.$parent.closeBox()
          proxy.$parent.$emit('success', { captchaVerification })
        }, 1000)
      }
      else {
        moveBlockBackgroundColor.value = '#d9534f'
        leftBarBorderColor.value = '#d9534f'
        iconColor.value = '#fff'
        iconClass.value = 'icon-close'
        passFlag.value = false
        setTimeout(() => {
          refresh()
        }, 1000)
        proxy.$parent.$emit('error', proxy)
        tipWords.value = t('component.captcha.fail')
        setTimeout(() => {
          tipWords.value = ''
        }, 1000)
      }
    })
    status.value = false
  }
}

async function refresh() {
  showRefresh.value = true
  finishText.value = ''

  transitionLeft.value = 'left .3s'
  moveBlockLeft.value = 0

  leftBarWidth.value = undefined
  transitionWidth.value = 'width .3s'

  leftBarBorderColor.value = '#ddd'
  moveBlockBackgroundColor.value = '#fff'
  iconColor.value = '#000'
  iconClass.value = 'icon-right'
  isEnd.value = false

  await getPictrue()
  setTimeout(() => {
    transitionWidth.value = ''
    transitionLeft.value = ''
    text.value = explain.value
  }, 300)
}

// 请求背景图片和验证图片
async function getPictrue() {
  const data = {
    captchaType: captchaType.value,
  }
  const res = await getCaptcha(data)
  if (res.data.repCode === '0000') {
    backImgBase.value = res.data.repData.originalImageBase64
    blockBackImgBase.value = `data:image/png;base64,${res.data.repData.jigsawImageBase64}`
    backToken.value = res.data.repData.token
    secretKey.value = res.data.repData.secretKey
  }
  else {
    tipWords.value = res.data.repMsg
  }
}
</script>

<template>
  <div style="position: relative">
    <div v-if="type === '2'" class="verify-img-out" :style="{ height: `${parseInt(setSize.imgHeight) + vSpace}px` }">
      <div class="verify-img-panel" :style="{ width: setSize.imgWidth, height: setSize.imgHeight }">
        <img :src="`data:image/png;base64,${backImgBase}`" alt="" style=" display: block;width: 100%; height: 100%">
        <div v-show="showRefresh" class="verify-refresh" @click="refresh">
          <i class="iconfont icon-refresh" />
        </div>
        <transition name="tips">
          <span v-if="tipWords" class="verify-tips" :class="passFlag ? 'suc-bg' : 'err-bg'">
            {{ tipWords }}
          </span>
        </transition>
      </div>
    </div>
    <!-- 公共部分 -->
    <div class="verify-bar-area" :style="{ 'width': setSize.imgWidth, 'height': barSize.height, 'line-height': barSize.height }">
      <span class="verify-msg" v-text="text" />
      <div
        class="verify-left-bar"
        :style="{
          'width': leftBarWidth !== undefined ? leftBarWidth : barSize.height,
          'height': barSize.height,
          'border-color': leftBarBorderColor,
          'transaction': transitionWidth,
        }"
      >
        <span class="verify-msg" v-text="finishText" />
        <div
          class="verify-move-block"
          :style="{
            'width': barSize.height,
            'height': barSize.height,
            'background-color': moveBlockBackgroundColor,
            'left': moveBlockLeft,
            'transition': transitionLeft,
          }"
          @touchstart="start"
          @mousedown="start"
        >
          <i class="iconfont verify-icon" :class="[iconClass]" :style="{ color: iconColor }" />
          <div
            v-if="type === '2'"
            class="verify-sub-block"
            :style="{
              'width': `${Math.floor((parseInt(setSize.imgWidth) * 47) / 310)}px`,
              'height': setSize.imgHeight,
              'top': `-${parseInt(setSize.imgHeight) + vSpace}px`,
              'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
            }"
          >
            <img :src="blockBackImgBase" alt="" style=" display: block;width: 100%; height: 100%; -webkit-user-drag: none">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
