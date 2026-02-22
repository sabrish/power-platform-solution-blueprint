import { type CSSProperties } from 'react';
import { Tooltip, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  truncated: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    display: 'block',
  },
});

interface TruncatedTextProps {
  text: string;
  maxWidth?: string;
  style?: CSSProperties;
}

/**
 * Component that truncates long text with ellipsis and shows full text on hover
 * Prevents table column overflow issues with long URLs, names, etc.
 */
export function TruncatedText({ text, maxWidth, style }: TruncatedTextProps) {
  const styles = useStyles();

  return (
    <Tooltip content={text} relationship="description">
      <span
        className={styles.truncated}
        style={{ ...style, maxWidth: maxWidth || '100%' }}
      >
        {text}
      </span>
    </Tooltip>
  );
}
