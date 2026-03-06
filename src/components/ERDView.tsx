import { useRef } from 'react';
import {
  Text,
  Title3,
  Card,
  Badge,
  Button,
  makeStyles,
  tokens,
  Toast,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  Copy24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import type { ERDDefinition, BlueprintResult } from '../core';
import { generateDbDiagramCode } from '../utils/dbDiagramGenerator';
import { ERDCanvasView } from './ERDCanvasView';

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
  emptyState: {
    padding: tokens.spacingVerticalXXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export interface ERDViewProps {
  erd: ERDDefinition;
  blueprintResult: BlueprintResult;
}

export function ERDView({ erd, blueprintResult }: ERDViewProps) {
  const styles = useStyles();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);

  const handleDownloadSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entity-relationship-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMermaid = () => {
    const diagram = erd.diagrams[0];
    if (diagram) {
      navigator.clipboard.writeText(diagram.mermaidDiagram);
      dispatchToast(
        <Toast>
          <ToastTitle action={<Checkmark24Regular />}>Mermaid code copied to clipboard</ToastTitle>
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

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />

      <div className={styles.diagramSection}>
        <Title3>Entity Relationship Diagram</Title3>
        <Text>
          {erd.totalEntities} total entities, {erd.totalRelationships} total relationships
        </Text>

        <div className={styles.diagramControls}>
          <Button icon={<ArrowDownload24Regular />} onClick={handleDownloadSVG} disabled={!erd.graphData}>
            Download SVG
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyMermaid} disabled={erd.diagrams.length === 0}>
            Copy Mermaid Code
          </Button>
          <Button icon={<Copy24Regular />} onClick={handleCopyDbDiagram}>
            Copy dbdiagram.io Code
          </Button>
        </div>

        <Card className={styles.diagramCard}>
          {erd.graphData ? (
            <ERDCanvasView graphData={erd.graphData} height={600} svgRef={svgRef} />
          ) : (
            <div className={styles.emptyState}>
              <Text>Diagram preview unavailable. Use the export options to generate the full ERD.</Text>
            </div>
          )}
        </Card>
      </div>

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
