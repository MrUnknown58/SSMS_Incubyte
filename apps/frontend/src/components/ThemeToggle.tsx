import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Button
      variant="secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full px-3 py-2"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
    </Button>
  );
}
