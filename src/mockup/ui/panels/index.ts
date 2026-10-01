import { Aperture, Camera, Download, ImageIcon, Orbit, Palette, Smartphone, Sparkles, Sun } from 'lucide-react'
import type { ComponentType } from 'react'
import type { PanelId } from '../../types'
import { BackgroundPanel } from './BackgroundPanel'
import { CameraPanel } from './CameraPanel'
import { DepthPanel } from './DepthPanel'
import { DevicePanel } from './DevicePanel'
import { EffectsPanel } from './EffectsPanel'
import { ExportPanel } from './ExportPanel'
import { LightingPanel } from './LightingPanel'
import { MediaPanel } from './MediaPanel'
import { MotionPanel } from './MotionPanel'

export type PanelEntry = { id: PanelId; label: string; icon: ComponentType<{ className?: string }>; component: ComponentType }

export const PANELS: PanelEntry[] = [
  { id: 'media', label: 'Media', icon: ImageIcon, component: MediaPanel },
  { id: 'device', label: 'Device', icon: Smartphone, component: DevicePanel },
  { id: 'camera', label: 'Camera', icon: Camera, component: CameraPanel },
  { id: 'background', label: 'Scene', icon: Palette, component: BackgroundPanel },
  { id: 'lighting', label: 'Lighting', icon: Sun, component: LightingPanel },
  { id: 'depth', label: 'Depth', icon: Aperture, component: DepthPanel },
  { id: 'effects', label: 'Effects', icon: Sparkles, component: EffectsPanel },
  { id: 'motion', label: 'Motion', icon: Orbit, component: MotionPanel },
  { id: 'export', label: 'Export', icon: Download, component: ExportPanel },
]
