<template>
  <CollapseContainer title="基本设置" :canExpan="false">
    <Row :gutter="24">
      <Col :span="14">
        <BasicForm @register="register" />
      </Col>
      <Col :span="10">
        <div class="change-avatar">
          <div class="mb-2">头像</div>
          <CropperAvatar
            :value="avatar"
            btnText="更换头像"
            :btnProps="{ preIcon: 'ant-design:cloud-upload-outlined' }"
            @change="updateAvatar"
            width="150"
          />
        </div>
      </Col>
    </Row>
    <Button type="primary" @click="handleSubmit"> 更新基本信息 </Button>
  </CollapseContainer>
</template>
<script setup lang="ts">
import { Button, Row, Col } from 'ant-design-vue'
import { computed, onMounted } from 'vue'
import { BasicForm, useForm } from '@/components/Form/index'
import { CollapseContainer } from '@/components/Container'
import { CropperAvatar } from '@/components/Cropper'
import { useMessage } from '@/hooks/web/useMessage'
import headerImg from '@/assets/images/header.jpg'
import { baseSetschemas } from './data'
import { useUserStore } from '@/store/modules/user'
import { getUserProfileApi, updateUserProfileApi, uploadAvatarApi } from '@/api/base/profile'

const { createMessage } = useMessage()
const userStore = useUserStore()

const [register, { setFieldsValue, validate }] = useForm({
  labelWidth: 120,
  schemas: baseSetschemas,
  showActionButtonGroup: false
})

onMounted(async () => {
  const data = await getUserProfileApi()
  setFieldsValue(data)
})

const avatar = computed(() => {
  const { avatar } = userStore.getUserInfo.user
  return avatar || headerImg
})

async function updateAvatar({ src, data }) {
  await uploadAvatarApi({ avatarFile: data })
  const userinfo = userStore.getUserInfo
  userinfo.user.avatar = src
  userStore.setUserInfo(userinfo)
  console.log('data', data)
}

async function handleSubmit() {
  try {
    const values = await validate()
    await updateUserProfileApi(values)
  } finally {
    createMessage.success('更新成功！')
  }
}
</script>

<style lang="less" scoped>
.change-avatar {
  img {
    display: block;
    margin-bottom: 15px;
    border-radius: 50%;
  }
}
</style>
