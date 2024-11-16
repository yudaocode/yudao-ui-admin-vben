<script type="text/babel">
/**
 * Verify 验证码组件
 * @description 分发验证码使用
 */
import { computed, ref, toRefs, watchEffect } from 'vue';

// import { $t } from '@vben/locales';

import VerifyPoints from './Verify/VerifyPoints.vue';
import VerifySlide from './Verify/VerifySlide.vue';

import './style/verify.css';

export default {
  name: 'Vue3Verify',
  components: {
    VerifyPoints,
    VerifySlide,
  },
  props: {
    arith: {
      default: 0,
      type: Number,
    },
    barSize: {
      default: () => {
        return {
          height: '40px',
          width: '310px',
        };
      },
      type: Object,
    },
    blockSize: {
      default() {
        return {
          height: '50px',
          width: '50px',
        };
      },
      type: Object,
    },
    captchaType: {
      required: true,
      type: String,
    },
    explain: {
      default: '',
      type: String,
    },
    figure: {
      default: 0,
      type: Number,
    },
    imgSize: {
      default() {
        return {
          height: '155px',
          width: '310px',
        };
      },
      type: Object,
    },
    mode: {
      default: 'pop',
      type: String,
    },
    vSpace: {
      default: 5,
      type: Number,
    },
  },
  setup(props) {
    const { captchaType, mode } = toRefs(props);
    const clickShow = ref(false);
    const verifyType = ref(undefined);
    const componentType = ref(undefined);

    const instance = ref({});

    const showBox = computed(() => {
      return mode.value === 'pop' ? clickShow.value : true;
    });
    /**
     * refresh
     * @description 刷新
     */
    const refresh = () => {
      if (instance.value.refresh) instance.value.refresh();
    };
    const closeBox = () => {
      clickShow.value = false;
      refresh();
    };
    const show = () => {
      if (mode.value === 'pop') clickShow.value = true;
    };
    watchEffect(() => {
      switch (captchaType.value) {
        case 'blockPuzzle': {
          verifyType.value = '2';
          componentType.value = 'VerifySlide';
          break;
        }
        case 'clickWord': {
          verifyType.value = '';
          componentType.value = 'VerifyPoints';
          break;
        }
      }
    });

    return {
      clickShow,
      closeBox,
      componentType,
      instance,
      show,
      showBox,
      verifyType,
    };
  },
};
</script>

<template>
  <div v-show="showBox" :class="mode === 'pop' ? 'mask' : ''">
    <div
      :class="mode === 'pop' ? 'verifybox' : ''"
      :style="{ 'max-width': `${parseInt(imgSize.width) + 20}px` }"
    >
      <div v-if="mode === 'pop'" class="verifybox-top">
        请完成安全验证
        <span class="verifybox-close" @click="closeBox">
          <i class="iconfont icon-close"></i>
        </span>
      </div>
      <div
        :style="{ padding: mode === 'pop' ? '10px' : '0' }"
        class="verifybox-bottom"
      >
        <!-- 验证码容器 -->
        <component
          :is="componentType"
          v-if="componentType"
          ref="instance"
          :arith="arith"
          :bar-size="barSize"
          :block-size="blockSize"
          :captcha-type="captchaType"
          :explain="explain"
          :figure="figure"
          :img-size="imgSize"
          :mode="mode"
          :type="verifyType"
          :v-space="vSpace"
        />
      </div>
    </div>
  </div>
</template>
