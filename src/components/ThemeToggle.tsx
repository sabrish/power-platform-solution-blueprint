import {
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
  Desktop24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

const useStyles = makeStyles({
  button: {
    minWidth: '40px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  checkmark: {
    color: tokens.colorBrandForeground1,
  },
});

export function ThemeToggle() {
  const styles = useStyles();
  const { themeMode, currentTheme, changeTheme } = useTheme();

  const getIcon = () => {
    if (themeMode === 'system') {
      return <Desktop24Regular />;
    }
    return currentTheme === 'dark' ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />;
  };

  const handleThemeChange = (mode: ThemeMode) => {
    changeTheme(mode);
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          icon={getIcon()}
          className={styles.button}
          aria-label="Change theme"
          title="Change theme"
        />
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem
            onClick={() => handleThemeChange('light')}
            className={styles.menuItem}
          >
            <WeatherSunny24Regular />
            Light
            {themeMode === 'light' && <Checkmark24Regular className={styles.checkmark} />}
          </MenuItem>
          <MenuItem
            onClick={() => handleThemeChange('dark')}
            className={styles.menuItem}
          >
            <WeatherMoon24Regular />
            Dark
            {themeMode === 'dark' && <Checkmark24Regular className={styles.checkmark} />}
          </MenuItem>
          <MenuItem
            onClick={() => handleThemeChange('system')}
            className={styles.menuItem}
          >
            <Desktop24Regular />
            System
            {themeMode === 'system' && <Checkmark24Regular className={styles.checkmark} />}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
