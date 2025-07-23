<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  erpPriceInputFormatter,
  erpPriceMultiply,
  formatDateTime,
} from '@vben/utils';

import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Textarea,
} from 'ant-design-vue';

import { getAccountSimpleList } from '#/api/erp/finance/account';
import {
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
} from '#/api/erp/purchase/order';
import { getSupplierSimpleList } from '#/api/erp/purchase/supplier';
import { getSimpleUserList } from '#/api/system/user';

import PurchaseOrderItemForm from './PurchaseOrderItemForm.vue';

interface Props {
  type: string;
  id?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useVbenModal({
  title: computed(() => {
    if (props.type === 'create') return '添加采购订单';
    if (props.type === 'update') return '编辑采购订单';
    return '采购订单详情';
  }),
  width: '80%',
});

const formLoading = ref(false);
const formType = ref('');
const formData = ref<ErpPurchaseOrderApi.PurchaseOrder>({
  id: undefined,
  no: undefined,
  supplierId: undefined,
  orderTime: undefined,
  remark: undefined,
  fileUrl: undefined,
  discountPercent: 0,
  discountPrice: 0,
  totalPrice: 0,
  accountId: undefined,
  depositPrice: 0,
  status: 10,
  items: [],
});

const formRules = reactive({
  supplierId: [{ required: true, message: '供应商不能为空', trigger: 'blur' }],
  orderTime: [{ required: true, message: '订单时间不能为空', trigger: 'blur' }],
});

const formRef = ref();
const supplierList = ref<any[]>([]);
const userList = ref<any[]>([]);
const accountList = ref<any[]>([]);
const itemFormRef = ref();

/** 计算 discountPrice、totalPrice 价格 */
watch(
  () => [formData.value.items, formData.value.discountPercent],
  () => {
    if (!formData.value.items) {
      return;
    }
    // 计算 discountPrice 价格
    let totalPrice = 0;
    formData.value.items.forEach((item) => {
      totalPrice += item.totalPrice || 0;
    });
    formData.value.discountPrice = erpPriceMultiply(
      totalPrice,
      formData.value.discountPercent / 100,
    );
    formData.value.totalPrice = totalPrice - formData.value.discountPrice;
  },
  { deep: true },
);

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  modalApi.open();
  resetForm();
  formType.value = type;
  formData.value.id = id;
  formLoading.value = true;
  try {
    // 加载供应商、用户、账户列表
    supplierList.value = await getSupplierSimpleList();
    userList.value = await getSimpleUserList();
    accountList.value = await getAccountSimpleList();
    // 修改时，设置数据
    if (id) {
      const res = await getPurchaseOrder(id);
      formData.value = res;
      formData.value.orderTime = formatDateTime(formData.value.orderTime);
    }
  } finally {
    formLoading.value = false;
  }
  // 加载产品列表
  await nextTick();
  itemFormRef.value?.init(formData.value.items || []);
};

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  await formRef.value?.validate();
  await itemFormRef.value?.validate();
  formLoading.value = true;
  try {
    const data = formData.value as any;
    data.items = itemFormRef.value?.getData();
    if (formType.value === 'create') {
      await createPurchaseOrder(data);
      message.success('新增成功');
    } else {
      await updatePurchaseOrder(data);
      message.success('更新成功');
    }
    modalApi.close();
    emit('success');
  } finally {
    formLoading.value = false;
  }
};

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    no: undefined,
    supplierId: undefined,
    orderTime: undefined,
    remark: undefined,
    fileUrl: undefined,
    discountPercent: 0,
    discountPrice: 0,
    totalPrice: 0,
    accountId: undefined,
    depositPrice: 0,
    status: 10,
    items: [],
  };
  formRef.value?.resetFields();
};

defineExpose({ open });
</script>

<template>
  <Modal>
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      label-align="left"
    >
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="供应商" name="supplierId">
            <Select
              v-model:value="formData.supplierId"
              placeholder="请选择供应商"
              allow-clear
              show-search
              :disabled="formType === 'detail'"
            >
              <Select.Option
                v-for="item in supplierList"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="订单时间" name="orderTime">
            <DatePicker
              v-model:value="formData.orderTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择订单时间"
              :disabled="formType === 'detail'"
              class="w-full"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="备注" name="remark">
            <Textarea
              v-model:value="formData.remark"
              placeholder="请输入备注"
              :disabled="formType === 'detail'"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="附件" name="fileUrl">
            <Input
              v-model:value="formData.fileUrl"
              placeholder="请输入附件地址"
              :disabled="formType === 'detail'"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>

    <!-- 子表的表单 -->
    <PurchaseOrderItemForm
      ref="itemFormRef"
      :items="formData.items"
      :disabled="formType === 'detail'"
    />

    <Form
      :model="formData"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      label-align="left"
    >
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="优惠率(%)">
            <InputNumber
              v-model:value="formData.discountPercent"
              :formatter="erpPriceInputFormatter"
              placeholder="请输入优惠率"
              :disabled="formType === 'detail'"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="付款优惠">
            <InputNumber
              v-model:value="formData.discountPrice"
              :formatter="erpPriceInputFormatter"
              placeholder="请输入付款优惠"
              :disabled="true"
              class="w-full"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="优惠后金额">
            <InputNumber
              v-model:value="formData.totalPrice"
              :formatter="erpPriceInputFormatter"
              placeholder="请输入优惠后金额"
              :disabled="true"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="结算账户">
            <Select
              v-model:value="formData.accountId"
              placeholder="请选择结算账户"
              allow-clear
              :disabled="formType === 'detail'"
            >
              <Select.Option
                v-for="item in accountList"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="支付订金">
            <InputNumber
              v-model:value="formData.depositPrice"
              :formatter="erpPriceInputFormatter"
              placeholder="请输入支付订金"
              :disabled="formType === 'detail'"
              class="w-full"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>

    <template #footer>
      <Button @click="modalApi.close()">取消</Button>
      <Button
        v-if="formType !== 'detail'"
        :loading="formLoading"
        type="primary"
        @click="submitForm"
      >
        确定
      </Button>
    </template>
  </Modal>
</template>
