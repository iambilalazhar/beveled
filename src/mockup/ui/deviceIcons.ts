import { AppWindow, Box, Laptop, Monitor, RectangleHorizontal, Smartphone, Tablet, Watch } from 'lucide-react'
import type { ComponentType } from 'react'
import type { DeviceKind } from '../types'

export const DEVICE_ICONS: Record<DeviceKind, ComponentType<{ className?: string }>> = {
  phone: Smartphone,
  android: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
  browser: AppWindow,
  screen: RectangleHorizontal,
  watch: Watch,
  custom: Box,
}
