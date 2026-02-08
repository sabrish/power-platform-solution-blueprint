import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Checkbox,
  Text,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import type { BlueprintResult } from '@ppsb/core';
import { estimateMarkdownSize, estimateJsonSize, estimateHtmlSize, formatBytes } from '../utils/sizeEstimator';
import { ExportProgressOverlay } from './ExportProgressOverlay';
import { useExport } from '../hooks/useExport';

const useStyles = makeStyles({
  section: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground1,
  },
  formatOption: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
  },
  formatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  formatTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  formatDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginLeft: '24px', // Align with checkbox label
  },
  formatPreview: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    marginLeft: '24px',
  },
  quickSelect: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
});

export interface ExportDialogProps {
  isOpen: boolean;
  result: BlueprintResult;
  blueprintGenerator: any;
  onClose: () => void;
}

/**
 * Dialog for export options and execution
 */
export function ExportDialog({ isOpen, result, blueprintGenerator, onClose }: ExportDialogProps) {
  const styles = useStyles();
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['html']);

  const {
    exportZip,
    isExporting,
    progress,
    error,
    clearError,
  } = useExport(blueprintGenerator);

  // Estimate file sizes
  const estimates = useMemo(() => ({
    markdown: estimateMarkdownSize(result),
    json: estimateJsonSize(result),
    html: estimateHtmlSize(result),
  }), [result]);

  const estimatedFiles = useMemo(() => {
    // Estimate file count for markdown (README + summary files + entity files + analysis)
    const entityFiles = result.entities.length * 4; // overview, schema, automation, pipeline
    const summaryFiles = 12;
    const analysisFiles = 3;
    return 1 + summaryFiles + entityFiles + analysisFiles;
  }, [result]);

  const handleFormatToggle = (format: string, checked: boolean) => {
    if (checked) {
      setSelectedFormats([...selectedFormats, format]);
    } else {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    }
  };

  const handleSelectAll = () => {
    setSelectedFormats(['markdown', 'json', 'html']);
  };

  const handleDeselectAll = () => {
    setSelectedFormats([]);
  };

  const handleExport = async () => {
    await exportZip(selectedFormats);
  };

  const handleClose = () => {
    if (!isExporting) {
      clearError();
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                  onClick={handleClose}
                  disabled={isExporting}
                />
              }
            >
              Export System Blueprint
            </DialogTitle>

            <DialogContent>
              {error && (
                <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
                  <MessageBarBody>
                    <strong>Export Failed:</strong> {error.message}
                  </MessageBarBody>
                </MessageBar>
              )}

              {/* Format Selection */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Select Export Formats</div>

                <div className={styles.quickSelect}>
                  <Button size="small" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button size="small" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>

                {/* Markdown Option */}
                <div className={styles.formatOption}>
                  <div className={styles.formatHeader}>
                    <Checkbox
                      checked={selectedFormats.includes('markdown')}
                      onChange={(_, data) => handleFormatToggle('markdown', data.checked as boolean)}
                      label={<span className={styles.formatTitle}>Markdown</span>}
                    />
                  </div>
                  <div className={styles.formatDescription}>
                    Complete file structure - ideal for Azure DevOps Wiki
                  </div>
                  <div className={styles.formatPreview}>
                    ~{estimatedFiles} files, {formatBytes(estimates.markdown)}
                  </div>
                </div>

                {/* JSON Option */}
                <div className={styles.formatOption}>
                  <div className={styles.formatHeader}>
                    <Checkbox
                      checked={selectedFormats.includes('json')}
                      onChange={(_, data) => handleFormatToggle('json', data.checked as boolean)}
                      label={<span className={styles.formatTitle}>JSON</span>}
                    />
                  </div>
                  <div className={styles.formatDescription}>
                    Full blueprint data - use for baselines and automation
                  </div>
                  <div className={styles.formatPreview}>
                    ~{formatBytes(estimates.json)}
                  </div>
                </div>

                {/* HTML Option */}
                <div className={styles.formatOption}>
                  <div className={styles.formatHeader}>
                    <Checkbox
                      checked={selectedFormats.includes('html')}
                      onChange={(_, data) => handleFormatToggle('html', data.checked as boolean)}
                      label={<span className={styles.formatTitle}>HTML</span>}
                    />
                  </div>
                  <div className={styles.formatDescription}>
                    Self-contained document - open in any browser
                  </div>
                  <div className={styles.formatPreview}>
                    ~{formatBytes(estimates.html)}
                  </div>
                </div>
              </div>

              {/* Export Info */}
              <div className={styles.section}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {selectedFormats.length === 0 && 'Select at least one format to export'}
                  {selectedFormats.length === 1 && selectedFormats[0] === 'markdown' && 'Export will download as ZIP archive (Markdown contains multiple files)'}
                  {selectedFormats.length === 1 && selectedFormats[0] !== 'markdown' && `Export will download as single ${selectedFormats[0].toUpperCase()} file`}
                  {selectedFormats.length > 1 && `Export will download as ZIP archive with ${selectedFormats.length} formats`}
                </Text>
              </div>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={handleClose} disabled={isExporting}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleExport}
                disabled={selectedFormats.length === 0 || isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Progress Overlay */}
      {isExporting && progress && <ExportProgressOverlay progress={progress} />}
    </>
  );
}
