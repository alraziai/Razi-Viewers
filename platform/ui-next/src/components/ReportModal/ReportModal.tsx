import React, { useState, useEffect } from 'react';
import { Button, Icons } from '../';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: string;
}

export function ReportModal({ isOpen, onClose, studyId }: ReportModalProps) {
  const [reportData, setReportData] = useState<string>('');
  const [editedReport, setEditedReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedReportPath, setResolvedReportPath] = useState<string | null>(null);

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

  const isHtmlDocument = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
  };

  const getReportPaths = (reportId: string) => {
    const config = (window as any)?.config ?? {};
    const configuredPath = typeof config.reportApiPath === 'string' ? config.reportApiPath : '';
    const configuredPaths = Array.isArray(config.reportApiPaths)
      ? config.reportApiPaths.filter((value: unknown) => typeof value === 'string')
      : [];

    const defaultPaths = ['/api/diagnosis', '/api/diagnoses', '/api/studies'];
    const basePaths = configuredPaths.length > 0 ? configuredPaths : configuredPath ? [configuredPath] : defaultPaths;

    const paths = basePaths.map(basePath => {
      const normalized = basePath.startsWith('/') ? basePath : `/${basePath}`;
      return `${normalized}/${encodeURIComponent(reportId)}/report`;
    });

    console.info(
      '[ReportModal] report paths',
      paths,
      configuredPaths.length || configuredPath ? '(from config)' : '(default)'
    );
    return paths;
  };

  useEffect(() => {
    if (isOpen && studyId) {
      fetchReport();
    }
  }, [isOpen, studyId]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reportPaths = getReportPaths(studyId);
      let response: Response | null = null;
      let responsePath = '';

      for (const path of reportPaths) {
        console.info('[ReportModal] fetchReport trying path', path);
        const candidate = await fetch(path, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (candidate.ok) {
          response = candidate;
          responsePath = path;
          break;
        }

        if (candidate.status !== 404) {
          response = candidate;
          responsePath = path;
          break;
        }

        console.warn('[ReportModal] fetchReport 404 for path', path);
      }

      if (!response) {
        throw new Error(`Failed to fetch report: 404 for ${reportPaths.join(', ')}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.status}`);
      }

      if (responsePath) {
        setResolvedReportPath(responsePath);
      }

      const { parsed, isJson, rawBody } = await parseMaybeJson(response);
      console.log('DEBUG - Full API response:', parsed);

      // Extract the report from the nested structure
      const report = (parsed as any)?.data?.report ?? parsed;
      console.log('DEBUG - Extracted report:', report);
      console.log('DEBUG - Report type:', typeof report);

      if (!isJson && typeof report === 'string' && isHtmlDocument(report)) {
        setError('Report API returned HTML instead of JSON. Check endpoint/proxy.');
        console.error('[ReportModal] Report response is HTML:', rawBody.slice(0, 200));
        return;
      }

      // Always ensure we stringify the report to a JSON string
      const formattedJson = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
      console.log('DEBUG - Formatted JSON type:', typeof formattedJson);
      
      setReportData(formattedJson);
      setEditedReport(formattedJson);
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
      const parsedData = JSON.parse(editedReport);

      const targetPath = resolvedReportPath || getReportPaths(studyId)[0];
      console.info('[ReportModal] handleSave using path', targetPath);

      const response = await fetch(targetPath, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status}`);
      }

      // Update the original data
      setReportData(editedReport);
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
            <p className="text-sm text-white/60 mt-1">Study ID: {String(studyId)}</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
                <label className="text-sm font-medium text-white">Report Data (JSON)</label>
                {editedReport !== reportData && (
                  <span className="text-xs text-yellow-400">● Unsaved changes</span>
                )}
              </div>
              <textarea
                value={typeof editedReport === 'string' ? editedReport : JSON.stringify(editedReport, null, 2)}
                onChange={(e) => setEditedReport(e.target.value)}
                className="w-full h-[500px] p-4 bg-[#0D1B2E] border border-white/20 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-[#48FFF6] focus:ring-1 focus:ring-[#48FFF6]"
                placeholder="Report data will appear here..."
                spellCheck={false}
              />
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
    </div>
  );
}

export default ReportModal;
