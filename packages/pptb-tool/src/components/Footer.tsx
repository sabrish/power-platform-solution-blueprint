import { makeStyles, tokens, Text, Link } from '@fluentui/react-components';

const useStyles = makeStyles({
  footer: {
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  text: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

export function Footer() {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <Text className={styles.text}>Power Platform Solution Blueprint (PPSB) v0.5</Text>
      <Text className={styles.text}>•</Text>
      <Link
        href="https://github.com/sabrish/power-platform-solution-blueprint"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.text}
      >
        GitHub Repository
      </Link>
    </footer>
  );
}
