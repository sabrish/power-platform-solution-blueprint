import { useState, useEffect } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  Button,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  Toast,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Copy24Regular,
  ZoomIn24Regular,
  ZoomOut24Regular,
  Info24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { ERDDefinition, BlueprintResult } from '../core';
import { renderMermaid, initMermaid } from '../utils/mermaidRenderer';
import { generateDbDiagramCode } from '../utils/dbDiagramGenerator';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  diagramSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  diagramCard: {
    padding: tokens.spacingVerticalL,
  },
  diagramControls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  diagramContainer: {
    display: 'inline-block',
    minHeight: '400px',
    minWidth: '100%',
    padding: tokens.spacingVerticalL,
  },
  legendSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalM,
  },
  legendCard: {
    padding: tokens.spacingVerticalM,
  },
  legendHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

export interface ERDViewProps {
  erd: ERDDefinition;
  blueprintResult: BlueprintResult;
}

export function ERDView({ erd, blueprintResult }: ERDViewProps) {
  const styles = useStyles();
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Toast notifications
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  // Use the first diagram (comprehensive view with all entities)
  const currentDiagram = erd.diagrams[0];

  // Initialize Mermaid on mount
  useEffect(() => {
    initMermaid();
  }, []);

  // Render Mermaid diagram when selected diagram changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!currentDiagram) return;

      try {
        setIsLoading(true);
        setError(null);
        const svg = await renderMermaid(
          currentDiagram.mermaidDiagram,
          `erd-diagram-${currentDiagram.id}`
        );
        setSvgContent(svg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render ERD');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [currentDiagram]);

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entity-relationship-diagram-${currentDiagram?.id || 'diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMermaid = () => {
    if (currentDiagram) {
      navigator.clipboard.writeText(currentDiagram.mermaidDiagram);
      dispatchToast(
        <Toast>
          <ToastTitle action={<Checkmark24Regular />}>
            Mermaid code copied to clipboard
          </ToastTitle>
        </Toast>,
        { intent: 'success', timeout: 2000 }
      );
    }
  };

  const handleCopyDbDiagram = () => {
    const dbDiagramCode = generateDbDiagramCode(blueprintResult);
    navigator.clipboard.writeText(dbDiagramCode);
    dispatchToast(
      <Toast>
        <ToastTitle action={<Checkmark24Regular />}>
          dbdiagram.io code copied! Paste it at https://dbdiagram.io/d
        </ToastTitle>
      </Toast>,
      { intent: 'success', timeout: 3000 }
    );
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  };

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />
      {/* ERD Diagram Section */}
      <div className={styles.diagramSection}>
        <Title3>Entity Relationship Diagram</Title3>
        <Text>
          {erd.totalEntities} total entities, {erd.totalRelationships} total relationships
        </Text>

        {/* Warnings */}
        {erd.warnings && erd.warnings.length > 0 && (
          <MessageBar intent="info" icon={<Info24Regular />}>
            <MessageBarBody>
              {erd.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </MessageBarBody>
          </MessageBar>
        )}

        {currentDiagram && (
          <Text style={{ marginTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground3 }}>
            {currentDiagram.description}
          </Text>
        )}

        <div className={styles.diagramControls}>
          <Button
            icon={<ArrowDownload24Regular />}
            onClick={handleDownloadSVG}
            disabled={!svgContent}
          >
            Download SVG
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyMermaid}>
            Copy Mermaid Code
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyDbDiagram}>
            Copy dbdiagram.io Code
          </Button>
          <Button icon={<ZoomIn24Regular />} onClick={handleZoomIn} disabled={zoomLevel >= 200}>
            Zoom In
          </Button>
          <Button icon={<ZoomOut24Regular />} onClick={handleZoomOut} disabled={zoomLevel <= 50}>
            Zoom Out
          </Button>
          <Text>{zoomLevel}%</Text>
        </div>

        <Card className={styles.diagramCard}>
          {isLoading && <Text>Rendering diagram...</Text>}
          {error && (
            <div style={{ padding: tokens.spacingVerticalL, textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <Text>Diagram preview unavailable. Use the export options to generate the full ERD.</Text>
            </div>
          )}
          {svgContent && !isLoading && !error && (
            <div
              className={styles.diagramContainer}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </Card>
      </div>

      {/* Publisher Legend Section */}
      <div className={styles.diagramSection}>
        <Title3>Publisher Color Legend</Title3>
        <div className={styles.legendSection}>
          {erd.legend.map((pub: any) => (
            <Card key={pub.publisherPrefix} className={styles.legendCard}>
              <div className={styles.legendHeader}>
                <div className={styles.legendColor} style={{ backgroundColor: pub.color }} />
                <Text weight="semibold">{pub.publisherName}</Text>
                <Badge appearance="outline" shape="rounded">{pub.entityCount}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
