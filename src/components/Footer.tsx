import { makeStyles, tokens, Text, Link } from '@fluentui/react-components';
import { Open20Regular } from '@fluentui/react-icons';
import packageJson from '../../package.json';

const useStyles = makeStyles({
  footer: {
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  text: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  iconLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    textDecoration: 'none',
    ':hover': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'underline',
    },
  },
});

export function Footer() {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <Text className={styles.text}>Power Platform Solution Blueprint (PPSB) v{packageJson.version}</Text>
      <Text className={styles.text}>•</Text>
      <Text className={styles.text}>
        by{' '}
        <Link
          href="https://github.com/sabrish"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: tokens.colorNeutralForeground3, textDecoration: 'none' }}
        >
          SAB
        </Link>
      </Text>
      <Text className={styles.text}>•</Text>
      <Link
        href="https://github.com/sabrish/power-platform-solution-blueprint"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.iconLink}
      >
        <Open20Regular />
        <span>GitHub</span>
      </Link>
    </footer>
  );
}
