import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { AppTab } from '@/hooks/useAppTabs';

interface TabNavProps {
  tabs: AppTab[];
}

/** White bold tabs on the black band; the active one is pink with a thick pink rule under it. */
export function TabNav({ tabs }: TabNavProps) {
  return (
    <nav aria-label="sections" className="flex items-center gap-8 lg:ml-[26px] lg:gap-[38px]">
      {tabs.map(({ to, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn('relative flex items-baseline gap-1.5 py-1 text-[20px] leading-none font-bold tracking-[-0.01em] whitespace-nowrap italic transition-colors', isActive ? 'text-pink' : 'text-white hover:text-pink-soft')
          }
        >
          {({ isActive }) => (
            <>
              {label}
              {badge !== undefined && <span>({badge})</span>}
              {isActive && <span aria-hidden className="absolute inset-x-0 -bottom-[9px] h-[4px] -rotate-[1.2deg] bg-pink" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
