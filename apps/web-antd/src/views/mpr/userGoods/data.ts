import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserGoodsApi } from '#/api/mpr/userGoods';

import { getSimpleAssistantList } from '#/api/mpr/assistant';
import { GoodsApi } from '#/api/mpr/goods';
import { getSimpleKeywordList } from '#/api/mpr/keyword';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

function getContactStatus(data: any) {
  // console.log("sellerContacted:", row.processing_status.sellerContacted);
  // console.log("整个row对象:", JSON.stringify(row, null, 2));
  const row = data.goods;
  if (!row || !row.processingStatus || !row.processingStatus.sellerContacted) {
    /* console.log(
      'sellerContacted路径不存在:',
      row
        ? (row.processingStatus
          ? 'sellerContacted不存在'
          : 'processingStatus不存在')
        : 'row不存在',
    );*/
    return 'Not Contacted';
  }

  /* console.log(
    'sellerContacted数据:',
    JSON.stringify(row.processingStatus.sellerContacted, null, 2),
  );*/

  if (row.processingStatus.sellerContacted.currentStatus !== 'completed') {
    // console.log('未联系: currentStatus不是completed');
    return 'Not Contacted';
  }

  if (
    row.processingStatus.sellerContacted.currentStatus === 'completed' &&
    row.processingStatus.sellerContacted.history &&
    row.processingStatus.sellerContacted.history.length > 0
  ) {
    /* console.log(
      '检查是否高价值, history长度:',
      row.processingStatus.sellerContacted.history.length,
    );*/

    const hasInterested = row.processingStatus.sellerContacted.history.some(
      (record) => {
        // console.log('检查记录:', JSON.stringify(record, null, 2));
        return record.interested === true;
      },
    );

    if (hasInterested) {
      // console.log('高价值: 找到interested为true的记录');
      return 'High Value';
    }
  }

  if (row.processingStatus.sellerContacted.currentStatus === 'completed') {
    // console.log('已联系: currentStatus是completed');
    return 'Contacted';
  }

  // console.log('默认返回Not Contacted');
  return 'Not Contacted';
}

function _getContactStatusType(row) {
  const status = this.getContactStatus(row);
  const typeMap = {
    'Not Contacted': 'info',
    'High Value': 'success',
    Contacted: 'warning',
  };
  return typeMap[status] || '';
}

function getAIAnalysisStatus(row) {
  if (!row) return 'Not Analyzed';

  if (!row.ai_summary && row.ai_category) {
    return `Not Analyzed (${row.ai_category})`;
  }

  if (
    row.ai_summary &&
    row.ai_summary.product_analysis &&
    row.ai_summary.product_analysis.matched === false
  ) {
    return 'Not Matched';
  }

  if (
    row.ai_summary &&
    row.ai_summary.product_analysis &&
    row.ai_summary.product_analysis.matched === true
  ) {
    return row.ai_summary.product_analysis.product_name || 'Matched';
  }

  return 'Not Analyzed';
}

function _getAIAnalysisStatusType(row) {
  const status = this.getAIAnalysisStatus(row);

  if (status.startsWith('Not Analyzed')) {
    return 'info';
  } else if (status === 'Not Matched') {
    return 'danger';
  } else if (status !== 'Not Analyzed') {
    return 'success';
  }

  return 'info';
}

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户ID',
      },
    },
    {
      fieldName: 'goodsId',
      label: '商品ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品ID',
      },
    },
    {
      fieldName: 'assistantId',
      label: '助理ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入助理ID',
      },
    },
    {
      fieldName: 'keywordId',
      label: '关键词ID',
      component: 'ApiSelect',
      componentProps: (values) => {
        return {
          api: getSimpleKeywordList,
          labelField: 'name',
          valueField: 'id',
          disabled: !!values.id,
        };
      },
    },
    {
      fieldName: 'goodsPhase',
      label: '商品阶段',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_GOODS_PHASE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'tags',
      label: '标签',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标签',
      },
    },
    {
      fieldName: 'remark',
      label: '用户备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        class: 'w-full',
        allowClear: true,
        placeholder: '请输入用户ID',
      },
      dependencies: {
        triggerFields: [''],
        if: false,
      },
    },
    {
      fieldName: 'assistantId',
      label: '助理',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleAssistantList,
        labelField: 'name',
        valueField: 'id',
        allowClear: true,
      },
    },
    {
      fieldName: 'keywordId',
      label: '关键词',
      component: 'Select',
      dependencies: {
        // 触发字段。只有这些字段值变动时，联动才会触发
        triggerFields: ['assistantId'],
        // 字段变更时，都会触发该函数
        trigger(_values, _formApi) {},
        // 动态组件参数
        async componentProps(values, _formApi) {
          if (values.assistantId) {
            values.keywordId = undefined;
            const keywords = await getSimpleKeywordList(values.assistantId);
            return {
              options: keywords.map((item) => ({
                label: item.keyword,
                value: item.id,
              })),
              placeholder: '请选择关键词',
              allowClear: true,
            } as any;
          } else {
            return {
              placeholder: '请选择助理',
            };
          }
        },
      },
    },
    {
      fieldName: 'goodsId',
      label: '商品ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品ID',
      },
    },
    {
      fieldName: 'tags',
      label: '标签',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标签',
      },
    },
    {
      fieldName: 'createTime',
      label: '发布时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<UserGoodsApi.UserGoods>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      minWidth: 120,
      visible: false,
    },
    {
      field: 'goodsId',
      title: '商品ID',
      minWidth: 120,
      cellRender: {
        name: 'CellLink',
        props: {
          target: '_blank',
          href: (row: any) => GoodsApi.FB_MP_GOODS_URL + row.goodsId,
          text: (row: any) => row.goodsId,
        },
      },
      visible: false,
    },
    {
      type: null,
      field: 'goods.details.thumbnail',
      title: '封面图',
      minWidth: 100,
      cellRender: {
        name: 'CellImagePro',
        props: {
          width: 80,
          height: 80,
          src: (row: any) => row.goods?.details.thumbnail,
        },
      },
    },
    {
      field: 'goods.details.images',
      title: '商品图片',
      minWidth: 100,
      // showOverflow: false,
      visible: false,
      cellRender: {
        name: 'CellImagesPro',
        props: {
          src: (row: any) => row.goods?.details.images,
          width: 80,
          height: 80,
        },
      },
    },
    {
      field: 'goods.title',
      title: '标题',
      headerAlign: 'center',
      align: 'left',
      minWidth: 180,
      cellRender: {
        name: 'CellLink',
        props: {
          target: '_blank',
          href: (row: any) => GoodsApi.FB_MP_GOODS_URL + row.goodsId,
          text: (row: any) => row.goods?.title,
        },
      },
    },
    {
      field: 'goodsPhase',
      title: '商品阶段',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_GOODS_PHASE },
      },
    },
    {
      field: 'goods.details.createTime',
      title: '发布时间',
      minWidth: 155,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'goods.details.pricing.formattedAmount',
      title: '价格',
      minWidth: 80,
    },
    {
      field: 'goods.details.seller.sellerName',
      title: '卖家',
      minWidth: 180,
      align: 'left',
      headerAlign: 'center',
      slots: {
        default: 'seller_default',
      },
    },
    {
      field: 'goods.details.status',
      title: '商品状态',
      minWidth: 120,
      slots: {
        default: 'goods_status_default',
      },
    },
    {
      field: 'goods.details.processingStatus.locationDisplayName',
      title: '联络状态',
      minWidth: 120,
      formatter: (params) => getContactStatus(params.row),
    },
    {
      field: 'goods.details.processingStatus.ai_summary',
      title: '分析',
      minWidth: 120,
      formatter: (params) => getAIAnalysisStatus(params.row),
    },
    {
      field: 'goods.details.location.locationDisplayName',
      title: '位置',
      minWidth: 120,
    },
    {
      field: 'goods.details.description',
      title: '详情',
      minWidth: 220,
    },
    {
      field: 'tags',
      title: '标签',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'userId',
      title: '用户ID',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '采集时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
