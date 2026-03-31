/**
 * Mock for lucide-react icons
 *
 * This mock replaces all lucide-react icon exports with simple span elements
 * to avoid ESM transformation issues in Jest tests.
 */

import React from 'react';

// Create a generic mock icon component
const createMockIcon = (name: string) => {
  const MockIcon = React.forwardRef<
    SVGSVGElement,
    React.SVGProps<SVGSVGElement>
  >((props, ref) => (
    <svg
      ref={ref}
      data-testid={`icon-${name.toLowerCase()}`}
      {...props}
    >
      <title>{name}</title>
    </svg>
  ));
  MockIcon.displayName = name;
  return MockIcon;
};

// Export all the icons used in the codebase
export const Loader2 = createMockIcon('Loader2');
export const Sparkles = createMockIcon('Sparkles');
export const AlertCircle = createMockIcon('AlertCircle');
export const Grid3X3 = createMockIcon('Grid3X3');
export const PenLine = createMockIcon('PenLine');
export const Brain = createMockIcon('Brain');
export const Wrench = createMockIcon('Wrench');
export const BookOpen = createMockIcon('BookOpen');
export const Plus = createMockIcon('Plus');
export const Search = createMockIcon('Search');
export const Filter = createMockIcon('Filter');
export const Eye = createMockIcon('Eye');
export const Edit = createMockIcon('Edit');
export const Archive = createMockIcon('Archive');
export const Trash2 = createMockIcon('Trash2');
export const CheckCircle2 = createMockIcon('CheckCircle2');
export const XCircle = createMockIcon('XCircle');
export const Upload = createMockIcon('Upload');
export const MoreVertical = createMockIcon('MoreVertical');
export const ArrowLeft = createMockIcon('ArrowLeft');
export const ArrowRight = createMockIcon('ArrowRight');
export const Calendar = createMockIcon('Calendar');
export const Clock = createMockIcon('Clock');
export const User = createMockIcon('User');
export const Tag = createMockIcon('Tag');
export const FileDown = createMockIcon('FileDown');
export const ExternalLink = createMockIcon('ExternalLink');
export const ChevronDown = createMockIcon('ChevronDown');
export const ChevronUp = createMockIcon('ChevronUp');
export const ChevronLeft = createMockIcon('ChevronLeft');
export const ChevronRight = createMockIcon('ChevronRight');
export const Check = createMockIcon('Check');
export const X = createMockIcon('X');
export const Menu = createMockIcon('Menu');
export const Settings = createMockIcon('Settings');
export const Home = createMockIcon('Home');
export const Info = createMockIcon('Info');
export const AlertTriangle = createMockIcon('AlertTriangle');
export const Database = createMockIcon('Database');
export const Crosshair = createMockIcon('Crosshair');
export const RefreshCcw = createMockIcon('RefreshCcw');
export const Shield = createMockIcon('Shield');
export const Activity = createMockIcon('Activity');
export const Compass = createMockIcon('Compass');
export const Target = createMockIcon('Target');
export const Telescope = createMockIcon('Telescope');
export const CheckCircle = createMockIcon('CheckCircle');
export const RefreshCw = createMockIcon('RefreshCw');
export const SearchX = createMockIcon('SearchX');
export const ShieldX = createMockIcon('ShieldX');
export const WifiOff = createMockIcon('WifiOff');
export const Server = createMockIcon('Server');
export const BookX = createMockIcon('BookX');
export const FileX = createMockIcon('FileX');
export const Lock = createMockIcon('Lock');
export const BarChart3 = createMockIcon('BarChart3');
export const MessageSquare = createMockIcon('MessageSquare');
export const Medal = createMockIcon('Medal');

// Default export for any unhandled icons
const defaultIcon = createMockIcon('Icon');
export default defaultIcon;

// Re-export createMockIcon for testing utilities
export { createMockIcon };
