import React, { useState, useEffect } from 'react';
import { Button, Icons } from '../';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosisId: string | number;
}

export function ReportModal({ isOpen, onClose, diagnosisId }: ReportModalProps) {
  const [reportData, setReportData] = useState<string>('');
  const [editedReport, setEditedReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedReportPath, setResolvedReportPath] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<unknown>(null);

  const parseMaybeJson = async (response: Response) => {
    const contentType = response.headers.get('content-type') ?? '';
    const rawBody = await response.text();
    const trimmed = rawBody.trim();
    const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

    if (contentType.includes('application/json') || looksLikeJson) {
      try {
        return { rawBody, parsed: JSON.parse(rawBody) as unknown, isJson: true };
      } catch (err) {
        console.error('[ReportModal] Failed to parse JSON response', err);
        return { rawBody, parsed: rawBody, isJson: false };
      }
    }

    return { rawBody, parsed: rawBody, isJson: false };
  };

  // Helper function to get cookie value by name
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Always try to get token from localStorage first
    let token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('access_token');
    console.log('[ReportModal] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

    // Fallback: Try sessionStorage (from postMessage)
    if (!token) {
      token = sessionStorage.getItem('auth_token');
      console.log('[ReportModal] Token from sessionStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    }

    // Fallback: Try to get token from cookies (shared across localhost ports)
    if (!token) {
      token = getCookie('auth_token') || getCookie('token') || getCookie('authToken') || getCookie('access_token');
      console.log('[ReportModal] Token from cookies:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    }

    // Last resort: Check sessionStorage for other possible token keys
    if (!token) {
      token = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      console.log('[ReportModal] Token from sessionStorage (alt keys):', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('[ReportModal] ✅ Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('[ReportModal] ❌ NO TOKEN FOUND - API request will fail!');
      console.log('[ReportModal] Available cookies:', document.cookie);
    }

    return headers;
  };

  const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('//');

  const normalizeBasePath = (value: string) => {
    if (isAbsoluteUrl(value)) {
      return value.replace(/\/+$/, '');
    }

    const normalized = value.startsWith('/') ? value : `/${value}`;
    return normalized.replace(/\/+$/, '');
  };

  const splitStudyIds = (value: string) =>
    value
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

  const summarizeErrorBody = (rawBody: string) => {
    const trimmed = rawBody.trim();
    if (!trimmed) {
      return '';
    }

    const snippet = trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed;
    return ` ${snippet}`;
  };

  const getReportPaths = (reportId: string) => {
    const config = (window as any)?.config ?? {};
    const configuredPath = typeof config.reportApiPath === 'string' ? config.reportApiPath : '';
    const configuredPaths = Array.isArray(config.reportApiPaths)
      ? config.reportApiPaths.filter((value: unknown) => typeof value === 'string')
      : [];

    const apiBaseUrl = typeof config.reportApiBaseUrl === 'string' ? config.reportApiBaseUrl : '';

    const defaultPaths = ['/api/diagnosis', '/api/diagnoses', '/api/studies'];
    const basePaths = configuredPaths.length > 0 ? configuredPaths : configuredPath ? [configuredPath] : defaultPaths;

    const reportIds = splitStudyIds(reportId);
    const idsToTry = reportIds.length > 0 ? reportIds : [reportId];
    const paths = basePaths.flatMap(basePath => {
      const normalized = normalizeBasePath(basePath);
      return idsToTry.map(id => {
        const reportPath = `${normalized}/${encodeURIComponent(id)}/report`;
        // If the path is relative and we have an API base URL, prepend it
        if (!isAbsoluteUrl(reportPath) && apiBaseUrl) {
          return `${apiBaseUrl}${reportPath}`;
        }
        return reportPath;
      });
    });

    console.info(
      '[ReportModal] report paths',
      paths,
      configuredPaths.length || configuredPath ? '(from config)' : '(default)',
      apiBaseUrl ? `with base URL: ${apiBaseUrl}` : ''
    );
    return paths;
  };

  useEffect(() => {
    if (isOpen && diagnosisId) {
      fetchReport();
    }
  }, [isOpen, diagnosisId]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reportPaths = getReportPaths(String(diagnosisId));
      let response: Response | null = null;
      let responsePath = '';
      let sawNon404 = false;
      let lastError: { status: number; statusText: string; body: string; path: string } | null = null;

      for (const path of reportPaths) {
        console.info('[ReportModal] fetchReport trying path', path);
        const candidate = await fetch(path, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (candidate.ok) {
          response = candidate;
          responsePath = path;
          break;
        }

        const { rawBody } = await parseMaybeJson(candidate);
        lastError = {
          status: candidate.status,
          statusText: candidate.statusText,
          body: rawBody,
          path,
        };

        if (candidate.status === 404) {
          console.warn('[ReportModal] fetchReport 404 for path', path);
          continue;
        }

        sawNon404 = true;
        console.warn('[ReportModal] fetchReport non-OK for path', path, candidate.status);
      }

      if (!response) {
        if (!sawNon404) {
          throw new Error(`Failed to fetch report: 404 for ${reportPaths.join(', ')}`);
        }

        if (lastError) {
          const bodySuffix = summarizeErrorBody(lastError.body);
          throw new Error(`Failed to fetch report: ${lastError.status} at ${lastError.path}${bodySuffix}`);
        }

        throw new Error('Failed to fetch report');
      }

      if (responsePath) {
        setResolvedReportPath(responsePath);
      }

      const { parsed } = await parseMaybeJson(response);
      console.log('DEBUG - Full API response:', parsed);

      // Extract the report from the nested structure
      const report = (parsed as any)?.data?.report ?? parsed;
      console.log('DEBUG - Extracted report:', report);
      console.log('DEBUG - Report type:', typeof report);

      // Always ensure we stringify the report to a JSON string
      const formattedJson = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
      console.log('DEBUG - Formatted JSON type:', typeof formattedJson);

      setReportData(formattedJson);
      setEditedReport(formattedJson);

      // Parse data for formatted view
      try {
        const parsed = typeof report === 'string' ? JSON.parse(report) : report;
        setParsedData(parsed);
      } catch (parseErr) {
        console.error('Failed to parse report for formatted view:', parseErr);
        setParsedData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
      console.error('Error fetching report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate JSON before saving
      let dataToSave;
      if (parsedData) {
        dataToSave = { report: parsedData };
      } else {
        dataToSave = { report: JSON.parse(editedReport) };
      }

      const targetPath = resolvedReportPath || getReportPaths(String(diagnosisId))[0];
      console.info('[ReportModal] handleSave using path', targetPath);

      const response = await fetch(targetPath, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status}`);
      }

      // Update the original data - keep parsedData as just the report, not wrapped
      const savedJson = JSON.stringify(parsedData || JSON.parse(editedReport), null, 2);
      setReportData(savedJson);
      setEditedReport(savedJson);
      // Don't change parsedData structure - it should stay as the unwrapped report
      alert('Report saved successfully!');
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save report');
      }
      console.error('Error saving report:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNestedValue = (path: string[], value: string) => {
    if (!parsedData) return;

    const newData = JSON.parse(JSON.stringify(parsedData));
    let current = newData;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setParsedData(newData);
    setEditedReport(JSON.stringify(newData, null, 2));
  };


  // Recursively render any object/array as editable key-value pairs
  const renderKeyValue = (data: any, path: string[] = []) => {
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' || data === null) {
      // Render as editable input or textarea for long strings
      const isLong = typeof data === 'string' && data.length > 60;
      return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 ease-in-out">
          <td className="py-3 px-4 text-sm font-medium text-white/80">{path[path.length - 1]}</td>
          <td className="py-3 px-4">
            {isLong ? (
              <textarea
                value={data as string}
                onChange={e => updateNestedValue(path, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#0D1B2E] border border-white/20 rounded text-white text-sm resize-none focus:outline-none focus:border-[#48FFF6] focus:ring-1 focus:ring-[#48FFF6]"
              />
            ) : (
              <input
                type="text"
                value={typeof data === 'boolean' ? String(data) : data}
                onChange={e => updateNestedValue(path, e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1B2E] border border-white/20 rounded text-white text-sm focus:outline-none focus:border-[#48FFF6] focus:ring-1 focus:ring-[#48FFF6]"
              />
            )}
          </td>
        </tr>
      );
    }
    if (Array.isArray(data)) {
      return data.map((item, idx) => renderKeyValue(item, [...path, String(idx)]));
    }
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => (
        <React.Fragment key={key + path.join('.')}>
          {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
            <tr className="bg-white/5">
              <td colSpan={2} className="py-2 px-4 text-sm font-semibold text-white/90">{key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</td>
            </tr>
          ) : null}
          {renderKeyValue(value, [...path, key])}
        </React.Fragment>
      ));
    }
    return null;
  };

  const renderFormattedView = () => {
    if (!parsedData) return null;
    return (
      <div className="space-y-6">
        <div className="bg-[#0D1B2E]/50 rounded-lg border border-white/10 overflow-hidden">
          <div className="bg-[#0D1B2E] px-4 py-3 border-b border-white/10">
            <h3 className="text-lg font-semibold text-[#48FFF6]">Report</h3>
          </div>
          <table className="w-full">
            <tbody>{renderKeyValue(parsedData)}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleClose = () => {
    if (editedReport !== reportData) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0A1628] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">AI Diagnosis Report</h2>
            <p className="text-sm text-white/60 mt-1">Diagnosis ID: {String(diagnosisId)}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-white/60 transition-colors ease-in-out duration-200 hover:bg-white/10 hover:text-white"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-12 h-12 border-4 border-[#48FFF6]/20 border-t-[#48FFF6] rounded-full animate-spin" />
              <p className="text-white/60">Loading report...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Icons.ByName name="status-alert" className="w-12 h-12 text-red-500" />
              <p className="text-red-400">{String(error)}</p>
              <Button onClick={fetchReport} variant="ghost">
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-white">AI Diagnosis Report</label>
                  {editedReport !== reportData && (
                    <span className="text-xs text-yellow-400">● Unsaved changes</span>
                  )}
                </div>
              </div>

              <div className="max-h-[500px] overflow-auto pr-2 custom-scrollbar">
                {renderFormattedView()}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <Button onClick={handleClose} variant="ghost" disabled={isSaving}>
              Cancel
            </Button>
            <button
              onClick={handleSave}
              disabled={isSaving || editedReport === reportData}
              className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#2E86D5] to-[#48FFF6] px-6 py-2.5 text-sm font-semibold text-[#0D0FAF] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0D0FAF]/20 border-t-[#0D0FAF] rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icons.Download className="w-4 h-4" />
                  Save Report
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(72, 255, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(72, 255, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

export default ReportModal;
