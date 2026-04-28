import type { ProjectData } from '@/types/project'
import { animatedLogoData } from './animatedLogo'
import { loadingSpinnerData } from './loadingSpinner'

export interface TemplateDefinition {
  name:        string
  description: string
  data:        ProjectData
  /** Inline SVG string for the static thumbnail preview */
  previewSvg:  string
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    name:        'Animated Logo',
    description: 'Rotating cross — great starting point for logo animations.',
    data:        animatedLogoData,
    previewSvg:  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="19" width="24" height="2.5" rx="1.25" fill="#ededf0"/>
      <rect x="18.75" y="8" width="2.5" height="24" rx="1.25" fill="#4353ff"/>
    </svg>`,
  },
  {
    name:        'Loading Spinner',
    description: 'Three staggered bouncing dots — a classic loading animation.',
    data:        loadingSpinnerData,
    previewSvg:  `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="20" r="4" fill="#4353ff"/>
      <circle cx="20" cy="16" r="4" fill="#ededf0"/>
      <circle cx="29" cy="20" r="4" fill="#4353ff"/>
    </svg>`,
  },
]
