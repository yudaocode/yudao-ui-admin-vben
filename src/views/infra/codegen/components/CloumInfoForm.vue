<template>
  <div class="step2">
    <div class="step2-form">
      <BasicForm @register="register" />
    </div>
    <Divider />
    <h3>说明</h3>
    <h4>转账到支付宝账户</h4>
    <p>
      如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。
    </p>

    <h4>转账到银行卡</h4>
    <p>
      如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。
    </p>
  </div>
</template>
<script lang="ts" setup>
import { BasicForm, useForm } from '@/components/Form'
import { basicInfoSchemas } from './data'
import { Divider } from 'ant-design-vue'

const emit = defineEmits(['next', 'prev'])

const [register, { validate }] = useForm({
  labelWidth: 120,
  schemas: basicInfoSchemas,
  actionColOptions: {
    span: 14
  },
  resetButtonOptions: {
    text: '上一步'
  },
  submitButtonOptions: {
    text: '下一步'
  },
  resetFunc: customResetFunc,
  submitFunc: customSubmitFunc
})

async function customResetFunc() {
  emit('prev')
}

async function customSubmitFunc() {
  try {
    const values = await validate()
    emit('next', values)
  } catch (error) {}
}
</script>
<style lang="less" scoped>
.step2 {
  &-form {
    width: 450px;
    margin: 0 auto;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 32px;
    color: @text-color;
  }

  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 22px;
    color: @text-color;
  }

  p {
    color: @text-color;
  }
}

.pay-select {
  width: 20%;
}

.pay-input {
  width: 70%;
}
</style>
