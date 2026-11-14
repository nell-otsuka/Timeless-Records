import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { AppTab } from '@/hooks/useAppTabs';

interface TabNavProps {
  tabs: AppTab[];
}

/** Plain spaced lowercase tabs; the active one is pink with an underline that draws in. */
export function TabNav({ tabs }: TabNavProps) {
  return (
    <nav aria-label="sections" className="flex items-center gap-7">
      {tabs.map(({ to, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn('group relative flex items-baseline gap-1.5 py-1.5 text-[12px] font-semibold tracking-[0.3em] transition-colors', isActive ? 'text-pink' : 'text-pink-soft hover:text-pink')
          }
        >
          {({ isActive }) => (
            <>
              {label}
              {badge !== undefined && <span className="font-mono text-[10px] font-normal tracking-normal">({badge})</span>}
              <span
                aria-hidden
                className={cn('absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-pink transition-transform duration-300', isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50')}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
