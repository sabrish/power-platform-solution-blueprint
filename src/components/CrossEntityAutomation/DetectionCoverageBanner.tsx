import { Text, Badge, makeStyles, tokens } from '@fluentui/react-components';
import { Lightbulb24Regular } from '@fluentui/react-icons';
import {
  PluginsIcon as BracesVariable24Regular,
  FlowsIcon as CloudFlow24Regular,
  BusinessRulesIcon as ClipboardTaskListLtr24Regular,
  ClassicWorkflowsIcon as ClipboardSettings24Regular,
  WebResourcesIcon as DocumentGlobe24Regular,
} from '../componentIcons';

const useStyles = makeStyles({
  banner: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'start',
  },
  bannerIcon: { color: tokens.colorBrandForeground1, flexShrink: 0, marginTop: tokens.spacingVerticalXXS },
  bannerContent: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXS },
  bannerTitleRow: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  bannerListRow: {
    margin: 0, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
  },
  bannerListRowSpaced: {
    margin: 0, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  bannerListIcon: {
    width: tokens.fontSizeBase300,
    height: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
});

export function DetectionCoverageBanner(): JSX.Element {
  const styles = useStyles();
  return (
    <div className={styles.banner}>
      <Lightbulb24Regular className={styles.bannerIcon} />
      <div className={styles.bannerContent}>
        <div className={styles.bannerTitleRow}>
          <Text weight="semibold">Detection Coverage Notice</Text>
          <Badge appearance="filled" shape="rounded" color="warning" size="small">Preview</Badge>
        </div>
        <Text as="p" className={styles.bannerListRow}><CloudFlow24Regular className={styles.bannerListIcon} /> <span><strong>Power Automate flows</strong> — cross-entity writes detected from flow JSON definitions.</span></Text>
        <Text as="p" className={styles.bannerListRow}><ClipboardSettings24Regular className={styles.bannerListIcon} /> <span><strong>Classic Workflows</strong> — cross-entity writes detected from XAML (CreateEntity / UpdateEntity steps).</span></Text>
        <Text as="p" className={styles.bannerListRow}><ClipboardTaskListLtr24Regular className={styles.bannerListIcon} /> <span><strong>Business Rules (server-scoped)</strong> — server-side rules detected from Dataverse workflow records. Form-scoped (client-only) rules are excluded.</span></Text>
        <div style={{ marginTop: tokens.spacingVerticalS, paddingTop: tokens.spacingVerticalS, borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, marginBottom: tokens.spacingVerticalXXS }}>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>Coming soon</Text>
            <Badge appearance="tint" shape="rounded" color="informative" size="small">Planned</Badge>
          </div>
          <Text as="p" className={styles.bannerListRow}><BracesVariable24Regular className={styles.bannerListIcon} /> <span><strong>Plugins (deep detection)</strong> — currently shows that a plugin fires (stage, filter attributes, firing status), but cannot identify what the plugin code itself writes to other entities. Plugin assembly decompilation is planned.</span></Text>
          <Text as="p" className={styles.bannerListRowSpaced}><DocumentGlobe24Regular className={styles.bannerListIcon} /> <span><strong>JavaScript Web Resources (static analysis)</strong> — currently cannot detect cross-entity Dataverse API calls embedded in custom JavaScript. JS static analysis is planned.</span></Text>
        </div>
      </div>
    </div>
  );
}
