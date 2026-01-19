'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faChartBar,
  faChartPie,
  faChartColumn,
  faTable,
  faGrip,
  faHeart,
  faSearch,
  faBaby,
  faSyringe,
  faTruck,
  faChevronDown,
  faChevronUp,
  faChevronRight,
  faChevronLeft,
  faArrowDown,
  faExternalLinkAlt,
  faCalendar,
  faCalendarAlt,
  faCalendarCheck,
  faList,
  faHome,
  faSignOutAlt,
  faBars,
  faTimes,
  faCheck,
  faExclamationTriangle,
  faInfoCircle,
  faCog,
  faUser,
  faClipboardList,
  faPaw,
  faChild,
  faEye,
  faStethoscope,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

// 아이콘 맵핑
const iconMap: Record<string, IconDefinition> = {
  'chart-line': faChartLine,
  'chart-bar': faChartBar,
  'chart-pie': faChartPie,
  'chart-column': faChartColumn,
  'chart-simple': faChartColumn,
  'table': faTable,
  'grip': faGrip,
  'heart': faHeart,
  'search': faSearch,
  'baby': faBaby,
  'baby-carriage': faChild,
  'syringe': faSyringe,
  'truck': faTruck,
  'chevron-down': faChevronDown,
  'chevron-up': faChevronUp,
  'arrow-down': faArrowDown,
  'external-link': faExternalLinkAlt,
  'pig': faPaw,
  'calendar': faCalendar,
  'calendar-alt': faCalendarAlt,
  'calendar-check': faCalendarCheck,
  'list': faList,
  'home': faHome,
  'sign-out': faSignOutAlt,
  'bars': faBars,
  'times': faTimes,
  'check': faCheck,
  'warning': faExclamationTriangle,
  'info': faInfoCircle,
  'cog': faCog,
  'user': faUser,
  'clipboard-list': faClipboardList,
  'paw': faPaw,
  'child': faChild,
  'eye': faEye,
  'stethoscope': faStethoscope,
  'chevron-right': faChevronRight,
  'chevron-left': faChevronLeft,
};

interface IconProps {
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'lg' | '1x' | '2x' | '3x';
}

export default function Icon({ name, className = '', size }: IconProps) {
  const icon = iconMap[name];

  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // size prop이 있으면 fa-* 클래스 추가
  const sizeClass = size ? `fa-${size}` : '';
  const combinedClassName = [className, sizeClass].filter(Boolean).join(' ');

  return (
    <FontAwesomeIcon
      icon={icon}
      className={combinedClassName}
    />
  );
}
