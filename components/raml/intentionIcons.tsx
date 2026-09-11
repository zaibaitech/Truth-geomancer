import {
  Sparkles, Heart, Coins, Briefcase, Activity, Users, Plane, Scale,
  KeyRound, Clock, Moon, type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/content/intentions';

export const INTENTION_ICONS: Record<IconName, LucideIcon> = {
  sparkles: Sparkles,
  heart: Heart,
  coins: Coins,
  briefcase: Briefcase,
  activity: Activity,
  users: Users,
  plane: Plane,
  scale: Scale,
  'key-round': KeyRound,
  clock: Clock,
  moon: Moon,
};
