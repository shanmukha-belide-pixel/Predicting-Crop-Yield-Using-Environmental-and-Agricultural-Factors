import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Table, X, Check, FileCode, Printer, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: string;
  modelsData?: any[];
  datasetInfo?: any;
}

export default function ReportExportModal({
  isOpen,
  onClose,
  crop,
  modelsData = [],
  datasetInfo
}: ReportExportModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // 1. Download Metrics as CSV
  const handleDownloadCSV = () => {
    try {
      setDownloading('csv');
      const headers = [
        'Model Name',
        'R2 (Random 80/20)',
        'RMSE (t/ha)',
        'MAE (t/ha)',
        'CV R2 (5-Fold Mean)',
        'CV R2 (5-Fold Std)',
        'Time-based R2',
        'Time-based RMSE',
        'Time-based MAE'
      ];

      const rows = modelsData.map((m: any) => [
        `"${m.name || m.display_name || ''}"`,
        m.r2 ?? '',
        m.rmse ?? '',
        m.mae ?? '',
        m.cv_r2_mean ?? '',
        m.cv_r2_std ?? '',
        m.r2_time ?? '',
        m.rmse_time ?? '',
        m.mae_time ?? ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `crop_yield_metrics_${crop.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Metrics CSV exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setDownloading(null);
    }
  };

  // 2. Download combined interactive HTML report
  const handleDownloadHTMLReport = () => {
    try {
      setDownloading('html');
      const generatedAt = new Date().toLocaleString();

      const tableRowsHTML = modelsData.map((m: any) => `
        <tr>
          <td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e7e5e4;">${m.name || m.display_name}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e7e5e4; font-family: monospace; color: #166534; font-weight: bold;">${(m.r2 ?? 0).toFixed(4)}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e7e5e4; font-family: monospace;">${(m.rmse ?? 0).toFixed(4)}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e7e5e4; font-family: monospace;">${(m.mae ?? 0).toFixed(4)}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e7e5e4; font-family: monospace;">${(m.cv_r2_mean ?? 0).toFixed(4)} &plusmn; ${(m.cv_r2_std ?? 0).toFixed(3)}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #e7e5e4; font-family: monospace;">${(m.r2_time ?? 0).toFixed(4)}</td>
        </tr>
      `).join('');

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Predicting Crop Yield Using Environmental and Agricultural Factors – Interactive Report</title>
  <style>
    :root {
      --primary: #14532D;
      --accent: #22C55E;
      --highlight: #F5B83D;
      --bg: #FAFAF7;
      --text: #1C1917;
      --card: #FFFFFF;
      --border: #E7E5E4;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 30px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: var(--card);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }
    h1 {
      font-size: 28px;
      color: var(--primary);
      margin-top: 0;
      margin-bottom: 8px;
      line-height: 1.25;
    }
    .subtitle {
      font-size: 16px;
      color: #78716c;
      margin-bottom: 24px;
    }
    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 30px;
    }
    .badge {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 500;
    }
    .card {
      background: #fafaf9;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 14px;
    }
    th {
      background: #f5f5f4;
      padding: 12px 14px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--border);
    }
    th.text-right { text-align: right; }
    .honesty-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 20px;
      margin-top: 30px;
    }
    .honesty-box h3 {
      color: #92400e;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .honesty-box ul {
      margin: 0;
      padding-left: 20px;
      color: #78350f;
      font-size: 13.5px;
    }
    .honesty-box li {
      margin-bottom: 6px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: #a8a29e;
    }
    .btn-print {
      float: right;
      background: var(--primary);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    }
    @media print {
      .btn-print { display: none; }
      body { padding: 0; background: white; }
      .container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
    <h1>Predicting Crop Yield Using Environmental and Agricultural Factors</h1>
    <div class="subtitle">Interactive Evaluation Report &bull; Crop Focus: <strong>${crop}</strong> &bull; Generated: ${generatedAt}</div>

    <div class="badge-bar">
      <span class="badge">Crop: ${crop}</span>
      <span class="badge">Records Covered: 1990 &ndash; 2013</span>
      <span class="badge">Models Evaluated: ${modelsData.length}</span>
      <span class="badge">Evaluation: Random 80/20, 5-Fold CV, Time-Based</span>
    </div>

    <div class="card">
      <h2 style="font-size: 18px; margin-top: 0; color: #14532D;">Regression Model Comparison Summary</h2>
      <p style="font-size: 13.5px; color: #57534e; margin-bottom: 15px;">
        Comparison of linear, polynomial, nonlinear (exponential, logistic) and Ridge regularised regression models trained on country-level climate and agricultural inputs.
      </p>
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th class="text-right">R&sup2; (Random)</th>
            <th class="text-right">RMSE (t/ha)</th>
            <th class="text-right">MAE (t/ha)</th>
            <th class="text-right">5-Fold CV R&sup2;</th>
            <th class="text-right">Time-Based R&sup2;</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML || '<tr><td colspan="6" style="padding: 15px; text-align: center;">No model data available.</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="honesty-box">
      <h3>Key Honesty Guidelines & Scientific Limitations</h3>
      <ul>
        <li><strong>Temporal proxy:</strong> <code>year</code> is a temporal proxy for cumulative technological and agronomic improvement, not a direct causal input.</li>
        <li><strong>Statistical association:</strong> Results represent empirical statistical associations, not definitive causal mechanisms.</li>
        <li><strong>Context only:</strong> Satellite imagery shown across application views represents contextual visualization only and is NOT a model input.</li>
        <li><strong>Aggregation scale:</strong> The dataset is aggregated at national country-level; outputs are for illustrative and academic evaluation, not direct on-farm decisions.</li>
      </ul>
    </div>

    <div class="footer">
      Predicting Crop Yield Using Environmental and Agricultural Factors &bull; Production Report Export
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `crop_yield_interactive_report_${crop.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Combined Interactive HTML Report exported successfully!');
    } catch (err) {
      toast.error('Failed to export HTML report');
    } finally {
      setDownloading(null);
    }
  };

  // 3. Download charts as PNG (Triggers browser print dialog or canvas snapshot)
  const handleDownloadChartsPNG = () => {
    try {
      setDownloading('png');
      // For simple and reliable PNG export, open a printable view or print current window
      window.print();
      toast.success('Print / Save chart preview opened!');
    } catch (err) {
      toast.error('Failed to trigger chart export');
    } finally {
      setDownloading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-accent/20 flex items-center justify-center text-primary dark:text-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-agri-text dark:text-white">
                Report Export
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Predicting Crop Yield Using Environmental and Agricultural Factors
              </p>
            </div>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-400 my-4 leading-relaxed">
            Download comprehensive documentation, metrics tables, and interactive HTML report packages for academic, research, or presentation review.
          </p>

          {/* Download Action Cards */}
          <div className="space-y-3 mt-6">
            {/* HTML Report */}
            <button
              onClick={handleDownloadHTMLReport}
              disabled={downloading !== null}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary/20 dark:border-accent/30 bg-primary/5 dark:bg-accent/5 hover:bg-primary/10 dark:hover:bg-accent/10 transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-agri-text dark:text-white group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    Download combined interactive HTML report
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Self-contained standalone report with styled tables &amp; honesty notes
                  </p>
                </div>
              </div>
              <Download className="h-4 w-4 text-stone-400 group-hover:text-primary dark:group-hover:text-accent transition-colors" />
            </button>

            {/* Metrics CSV */}
            <button
              onClick={handleDownloadCSV}
              disabled={downloading !== null}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center">
                  <Table className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-agri-text dark:text-white group-hover:text-accent-dark transition-colors">
                    Download metrics as CSV
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Raw numeric metrics (R², RMSE, MAE, CV, Time-split) across all 12 models
                  </p>
                </div>
              </div>
              <Download className="h-4 w-4 text-stone-400 group-hover:text-accent transition-colors" />
            </button>

            {/* Charts as PNG / Print */}
            <button
              onClick={handleDownloadChartsPNG}
              disabled={downloading !== null}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-left group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-info text-white flex items-center justify-center">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-agri-text dark:text-white group-hover:text-info transition-colors">
                    Download charts as PNG / Print
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    High-resolution printable snapshot of current dashboard views
                  </p>
                </div>
              </div>
              <Download className="h-4 w-4 text-stone-400 group-hover:text-info transition-colors" />
            </button>
          </div>

          {/* Honesty note */}
          <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-highlight/10 text-highlight-dark dark:text-highlight text-xs leading-relaxed">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Exported reports clearly note that findings represent empirical statistical associations at country-level, not farm-level prescriptions.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
