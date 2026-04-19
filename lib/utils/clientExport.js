function stringifyValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function escapeHtml(value) {
  return stringifyValue(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsv(value) {
  return `"${stringifyValue(value).replace(/"/g, '""')}"`;
}

function buildLoadingMarkup(title) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }

      main {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .card {
        width: min(420px, 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background: #ffffff;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }

      h1 {
        margin: 0 0 12px;
        font-size: 20px;
      }

      p {
        margin: 0;
        color: #475569;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="card">
        <h1>${escapeHtml(title)}</h1>
        <p>Preparing printable data...</p>
      </section>
    </main>
  </body>
</html>`;
}

function buildPrintMarkup({ title, subtitle = '', headers = [], rows = [], summaryLines = [] }) {
  const summaryMarkup = summaryLines.length
    ? `<section class="summary">${summaryLines
        .map((line) => `<div class="summary-item">${escapeHtml(line)}</div>`)
        .join('')}</section>`
    : '';

  const tableHead = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join('');

  const tableRows = rows
    .map(
      (row) => `<tr>${row
        .map((cell) => `<td>${escapeHtml(cell)}</td>`)
        .join('')}</tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #ffffff;
      }

      main {
        padding: 32px;
      }

      header {
        margin-bottom: 20px;
      }

      h1 {
        margin: 0;
        font-size: 26px;
        line-height: 1.2;
      }

      .subtitle {
        margin-top: 8px;
        color: #475569;
        font-size: 14px;
        line-height: 1.5;
      }

      .summary {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }

      .summary-item {
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 12px;
        color: #334155;
        background: #f8fafc;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      thead {
        display: table-header-group;
      }

      th,
      td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
        word-break: break-word;
      }

      th {
        background: #f8fafc;
        font-weight: 700;
      }

      tr {
        page-break-inside: avoid;
      }

      @media print {
        body {
          background: #ffffff;
        }

        main {
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </header>
      ${summaryMarkup}
      <table>
        <thead>
          <tr>${tableHead}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </main>
  </body>
</html>`;
}

export function downloadCsvFile({ filename, headers = [], rows = [] }) {
  if (typeof window === 'undefined') {
    return;
  }

  const csv = `\uFEFF${[
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  URL.revokeObjectURL(link.href);
}

function createPrintTarget(title) {
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  const iframe = document.createElement('iframe');

  iframe.title = title;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument || frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    iframe.remove();
    return null;
  }

  let isClosed = false;

  return {
    __managedPrintTarget: true,
    document: frameDocument,
    focus: () => frameWindow.focus(),
    print: () => frameWindow.print(),
    close: () => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      iframe.remove();
    },
    addEventListener: (...args) => frameWindow.addEventListener(...args),
    removeEventListener: (...args) => frameWindow.removeEventListener(...args),
    get onload() {
      return iframe.onload;
    },
    set onload(handler) {
      iframe.onload = handler;
    },
  };
}

export function openPrintWindow(title = 'Print Preview') {
  if (typeof window === 'undefined') {
    return null;
  }

  const printWindow = createPrintTarget(title);

  if (!printWindow) {
    throw new Error('Unable to prepare the report for printing. Please try again.');
  }

  printWindow.document.open();
  printWindow.document.write(buildLoadingMarkup(title));
  printWindow.document.close();

  return printWindow;
}

export function printTable({
  title,
  subtitle = '',
  headers = [],
  rows = [],
  summaryLines = [],
  printWindow = null,
}) {
  const targetWindow = printWindow || openPrintWindow(title);

  if (!targetWindow) {
    return null;
  }

  let hasPrinted = false;
  let hasClosed = false;

  const closePrintTarget = () => {
    if (hasClosed || !targetWindow.__managedPrintTarget) {
      return;
    }

    hasClosed = true;
    targetWindow.removeEventListener?.('afterprint', closePrintTarget);
    window.setTimeout(() => targetWindow.close(), 500);
  };

  const finalize = () => {
    if (hasPrinted) {
      return;
    }

    hasPrinted = true;
    targetWindow.focus();
    targetWindow.addEventListener?.('afterprint', closePrintTarget, { once: true });
    targetWindow.print();

    if (targetWindow.__managedPrintTarget) {
      window.setTimeout(closePrintTarget, 1500);
    } else {
      targetWindow.close();
    }
  };

  targetWindow.document.open();
  targetWindow.document.write(
    buildPrintMarkup({
      title,
      subtitle,
      headers,
      rows,
      summaryLines,
    })
  );
  targetWindow.document.close();
  targetWindow.onload = finalize;

  window.setTimeout(finalize, 300);

  return targetWindow;
}
