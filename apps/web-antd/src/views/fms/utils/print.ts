import { formatDate } from '@vben/utils';

export interface FmsTablePrintOptions {
  title: string;
  companyName: string;
  periodLabel: string;
  centerText?: string;
  footerLabels?: string[];
  tableElement: HTMLElement;
}

/**
 * 构建 FMS 表格打印文档
 *
 * 基于 VXE 主表格 DOM 克隆表头、表体和表尾；账簿/报表表格不要使用 VXE fixed 列，
 * 固定列渲染在独立 wrapper 中，不在主表格内，会导致打印缺列。
 *
 * @param options 打印参数
 * @return 可供 iframe 预览的 HTML
 */
export function buildFmsTablePrintHtml(options: FmsTablePrintOptions) {
  const header = cloneTableSection(
    options.tableElement,
    '.vxe-table--main-wrapper .vxe-table--header-wrapper thead',
  );
  const body = cloneTableSection(
    options.tableElement,
    '.vxe-table--main-wrapper .vxe-table--body-wrapper tbody',
  );
  const footer = cloneTableSection(
    options.tableElement,
    '.vxe-table--main-wrapper .vxe-table--footer-wrapper tfoot',
  );
  if (!header || !body) {
    throw new Error('未找到可打印的表格内容');
  }
  const printDate = formatDate(new Date(), 'YYYY-MM-DD');
  const footerLabels = [...(options.footerLabels || []), `打印日期：${printDate}`]
    .map((label) => `<span>${escapeHtml(label)}</span>`)
    .join('');
  return `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(options.title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #eef0f3; color: #303133; font-family: Arial, "Microsoft YaHei", sans-serif; font-size: 14px; }
          .print-page { width: calc(100% - 32px); min-height: 210mm; margin: 16px auto; padding: 12mm; background: #fff; box-shadow: 0 2px 12px rgba(0, 0, 0, .12); }
          h1 { margin: 0; text-align: center; font-size: 28px; font-weight: 600; }
          .print-meta, .print-footer { display: flex; justify-content: space-between; gap: 20px; padding: 12px 0; }
          .print-meta span { flex: 1; }
          .print-meta span:nth-child(2) { text-align: center; }
          .print-meta span:last-child { text-align: right; }
          table { width: 100%; border-collapse: collapse; table-layout: auto; }
          th, td { min-width: 54px; padding: 7px 6px; border: 1px solid #303133; line-height: 1.5; vertical-align: middle; word-break: break-word; }
          th { text-align: center; font-weight: 600; background: #f5f7fa; }
          td.is-right, th.is-right, td.is--right, th.is--right { text-align: right; }
          td.is-center, th.is-center, td.is--center, th.is--center { text-align: center; }
          tr { page-break-inside: avoid; }
          .print-footer { padding-bottom: 0; color: #606266; font-size: 12px; }
          @page { size: A3 landscape; margin: 8mm; }
          @media print {
            body { background: #fff; }
            .print-page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <main class="print-page">
          <h1>${escapeHtml(options.title)}</h1>
          <div class="print-meta">
            <span>编制单位：${escapeHtml(options.companyName)}</span>
            <span>${escapeHtml(options.centerText)}</span>
            <span>${escapeHtml(options.periodLabel)}</span>
          </div>
          <table>${header.outerHTML}${body.outerHTML}${footer?.outerHTML || ''}</table>
          <div class="print-footer">${footerLabels}</div>
        </main>
      </body>
    </html>`;
}

/** 直接打印 HTML，不打开预览弹窗 */
export function printFmsHtml(printHtml: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.srcdoc = printHtml;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };
  document.body.appendChild(iframe);
}

/** 克隆表格区域并清理不可打印元素 */
function cloneTableSection(tableElement: HTMLElement, selector: string) {
  const source = tableElement.querySelector<HTMLElement>(selector);
  if (!source) return undefined;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button').forEach((button) => {
    button.replaceWith(document.createTextNode(button.textContent || ''));
  });
  clone
    .querySelectorAll(
      'svg, input, textarea, .vxe-cell--checkbox, .vxe-cell--sort, .vxe-cell--filter, .vxe-cell--edit-icon',
    )
    .forEach((element) => element.remove());
  clone
    .querySelectorAll('[title]')
    .forEach((element) => element.removeAttribute('title'));
  return clone;
}

/** 转义 HTML 文本 */
export function escapeHtml(value?: number | string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
