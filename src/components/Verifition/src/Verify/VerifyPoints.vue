<script type="text/babel" setup>
/**
 * VerifyPoints
 * @description 点选
 * */
import { getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs } from 'vue'
import { resetSize } from './../utils/util'
import { aesEncrypt } from './../utils/ase'
import { checkCaptcha, getCaptcha } from '@/api/base/login'
import { useI18n } from '@/hooks/web/useI18n'

const props = defineProps({
  // 弹出式pop，固定fixed
  mode: {
    type: String,
    default: 'fixed',
  },
  captchaType: {
    type: String,
  },
  // 间隔
  vSpace: {
    type: Number,
    default: 5,
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
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '40px',
      }
    },
  },
})

const { t } = useI18n()
const { mode, captchaType } = toRefs(props)
const { proxy } = getCurrentInstance()
const secretKey = ref('') // 后端返回的ase加密秘钥
const checkNum = ref(3) // 默认需要点击的字数
const fontPos = reactive([]) // 选中的坐标信息
const checkPosArr = reactive([]) // 用户点击的坐标
const num = ref(1) // 点击的记数
const pointBackImgBase = ref('') // 后端获取到的背景图片
const poinTextList = reactive([]) // 后端返回的点击字体顺序
const backToken = ref('') // 后端返回的token值
const setSize = reactive({
  imgHeight: 0,
  imgWidth: 0,
  barHeight: 0,
  barWidth: 0,
})
const tempPoints = reactive([])
const text = ref('')
const barAreaColor = ref(undefined)
const barAreaBorderColor = ref(undefined)
const showRefresh = ref(true)
const bindingClick = ref(true)

function init() {
  // 加载页面
  fontPos.splice(0, fontPos.length)
  checkPosArr.splice(0, checkPosArr.length)
  num.value = 1
  getPictrue()
  nextTick(() => {
    const { imgHeight, imgWidth, barHeight, barWidth } = resetSize(proxy)
    setSize.imgHeight = imgHeight
    setSize.imgWidth = imgWidth
    setSize.barHeight = barHeight
    setSize.barWidth = barWidth
    proxy.$parent.$emit('ready', proxy)
  })
}
onMounted(() => {
  // 禁止拖拽
  init()
  proxy.$el.onselectstart = function () {
    return false
  }
})
const canvas = ref(null)

// 获取坐标
const getMousePos = function (obj, e) {
  const x = e.offsetX
  const y = e.offsetY
  return { x, y }
}
// 创建坐标点
const createPoint = function (pos) {
  tempPoints.push(Object.assign({}, pos))
  return num.value + 1
}

// 坐标转换函数
const pointTransfrom = function (pointArr, imgSize) {
  const newPointArr = pointArr.map((p) => {
    const x = Math.round((310 * p.x) / Number.parseInt(imgSize.imgWidth))
    const y = Math.round((155 * p.y) / Number.parseInt(imgSize.imgHeight))
    return { x, y }
  })
  return newPointArr
}

const refresh = async function () {
  tempPoints.splice(0, tempPoints.length)
  barAreaColor.value = '#000'
  barAreaBorderColor.value = '#ddd'
  bindingClick.value = true
  fontPos.splice(0, fontPos.length)
  checkPosArr.splice(0, checkPosArr.length)
  num.value = 1
  await getPictrue()
  showRefresh.value = true
}

function canvasClick(e) {
  checkPosArr.push(getMousePos(canvas, e))
  if (num.value === checkNum.value) {
    num.value = createPoint(getMousePos(canvas, e))
    // 按比例转换坐标值
    const arr = pointTransfrom(checkPosArr, setSize)
    checkPosArr.length = 0
    checkPosArr.push(...arr)
    // 等创建坐标执行完
    setTimeout(() => {
      // var flag = this.comparePos(this.fontPos, this.checkPosArr);
      // 发送后端请求
      const captchaVerification = secretKey.value
        ? aesEncrypt(`${backToken.value}---${JSON.stringify(checkPosArr)}`, secretKey.value)
        : `${backToken.value}---${JSON.stringify(checkPosArr)}`
      const data = {
        captchaType: captchaType.value,
        pointJson: secretKey.value ? aesEncrypt(JSON.stringify(checkPosArr), secretKey.value) : JSON.stringify(checkPosArr),
        token: backToken.value,
      }
      checkCaptcha(data).then((response) => {
        const res = response.data
        if (res.repCode === '0000') {
          barAreaColor.value = '#4cae4c'
          barAreaBorderColor.value = '#5cb85c'
          text.value = t('component.captcha.success')
          bindingClick.value = false
          if (mode.value === 'pop') {
            setTimeout(() => {
              proxy.$parent.clickShow = false
              refresh()
            }, 1500)
          }
          proxy.$parent.$emit('success', { captchaVerification })
        }
        else {
          proxy.$parent.$emit('error', proxy)
          barAreaColor.value = '#d9534f'
          barAreaBorderColor.value = '#d9534f'
          text.value = t('component.captcha.fail')
          setTimeout(() => {
            refresh()
          }, 700)
        }
      })
    }, 400)
  }
  if (num.value < checkNum.value)
    num.value = createPoint(getMousePos(canvas, e))
}

// 请求背景图片和验证图片
async function getPictrue() {
  const data = {
    captchaType: captchaType.value,
  }
  const res = await getCaptcha(data)
  if (res.data.repCode === '0000') {
    pointBackImgBase.value = res.data.repData.originalImageBase64
    backToken.value = res.data.repData.token
    secretKey.value = res.data.repData.secretKey
    poinTextList.value = res.data.repData.wordList
    text.value = `${t('component.captcha.point')}【${poinTextList.value.join(',')}】`
  }
  else {
    text.value = res.data.repMsg
  }
}
</script>

<template>
  <div style="position: relative">
    <div class="verify-img-out">
      <div
        class="verify-img-panel"
        :style="{
          'width': setSize.imgWidth,
          'height': setSize.imgHeight,
          'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
          'margin-bottom': `${vSpace}px`,
        }"
      >
        <div v-show="showRefresh" class="verify-refresh" style="z-index: 3" @click="refresh">
          <i class="iconfont icon-refresh" />
        </div>
        <img
          ref="canvas"
          :src="`data:image/png;base64,${pointBackImgBase}`"
          alt=""
          style=" display: block;width: 100%; height: 100%"
          @click="bindingClick ? canvasClick($event) : undefined"
        >

        <div
          v-for="(tempPoint, index) in tempPoints"
          :key="index"
          class="point-area"
          :style="{
            'background-color': '#1abd6c',
            'color': '#fff',
            'z-index': 9999,
            'width': '20px',
            'height': '20px',
            'text-align': 'center',
            'line-height': '20px',
            'border-radius': '50%',
            'position': 'absolute',
            'top': `${parseInt(tempPoint.y - 10)}px`,
            'left': `${parseInt(tempPoint.x - 10)}px`,
          }"
        >
          {{ index + 1 }}
        </div>
      </div>
    </div>
    <!-- 'height': this.barSize.height, -->
    <div
      class="verify-bar-area"
      :style="{
        'width': setSize.imgWidth,
        'color': barAreaColor,
        'border-color': barAreaBorderColor,
        'line-height': barSize.height,
      }"
    >
      <span class="verify-msg">{{ text }}</span>
    </div>
  </div>
</template>
