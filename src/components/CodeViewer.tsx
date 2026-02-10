import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Text,
} from '@fluentui/react-components';
import { Copy24Regular, ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeContainer: {
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
  },
  codeContainerExpanded: {
    maxHeight: 'none',
  },
  lineNumber: {
    display: 'inline-block',
    width: '40px',
    textAlign: 'right',
    paddingRight: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground4,
    userSelect: 'none',
  },
  codeLine: {
    padding: `2px ${tokens.spacingHorizontalM}`,
    whiteSpace: 'pre',
    overflowX: 'auto',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground5,
    },
  },
});

export interface CodeViewerProps {
  content: string;
  language?: string;
  maxLines?: number;
}

export function CodeViewer({ content, language = 'javascript', maxLines = 50 }: CodeViewerProps) {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = content.split('\n');
  const displayLines = isExpanded ? lines : lines.slice(0, maxLines);
  const hasMoreLines = lines.length > maxLines;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Failed to copy - silently ignore
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold">{language.toUpperCase()} ({lines.length} lines)</Text>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          {hasMoreLines && (
            <Button
              appearance="subtle"
              icon={isExpanded ? <ChevronDown20Regular /> : <ChevronRight20Regular />}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : `Show all ${lines.length} lines`}
            </Button>
          )}
          <Button
            appearance="subtle"
            icon={<Copy24Regular />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
      <div className={`${styles.codeContainer} ${isExpanded ? styles.codeContainerExpanded : ''}`}>
        {displayLines.map((line, idx) => (
          <div key={idx} className={styles.codeLine}>
            <span className={styles.lineNumber}>{idx + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
      {!isExpanded && hasMoreLines && (
        <Text style={{ color: tokens.colorNeutralForeground3, textAlign: 'center' }}>
          ... {lines.length - maxLines} more lines
        </Text>
      )}
    </div>
  );
}
