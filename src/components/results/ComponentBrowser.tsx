import { Tab, TabList, Tooltip, tokens, makeStyles } from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import type { BlueprintResult } from '../../core';
import { COMPONENT_TABS } from '../ComponentTabRegistry';

const useStyles = makeStyles({
  tabList: {
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalL,
  },
});

export interface ComponentBrowserProps {
  result: BlueprintResult;
  selectedTab: string;
  onTabSelect: (key: string) => void;
}

export function ComponentBrowser({
  result,
  selectedTab,
  onTabSelect,
}: ComponentBrowserProps): JSX.Element {
  const styles = useStyles();

  return (
    <>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
          onTabSelect(data.value as string);
        }}
        size="small"
        className={styles.tabList}
      >
        {COMPONENT_TABS.map((tab) => {
          if (tab.hidden?.(result)) return null;
          const count = tab.count(result);
          const isSelected = selectedTab === tab.key;
          return (
            <Tooltip key={tab.key} content={tab.label} relationship="label">
              <Tab value={tab.key} icon={tab.icon}>
                {isSelected ? `${tab.label} (${count})` : `${count}`}
              </Tab>
            </Tooltip>
          );
        })}
      </TabList>

      <div className={styles.tabContent}>
        {COMPONENT_TABS.map((tab) => {
          if (selectedTab !== tab.key) return null;
          if (tab.hidden?.(result)) return null;
          return <div key={tab.key}>{tab.render(result)}</div>;
        })}
      </div>
    </>
  );
}
