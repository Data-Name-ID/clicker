import type { AdProvider } from './AdProvider'
import { MockAdProvider } from './MockAdProvider'

export const mockAdProvider = new MockAdProvider()

export const adProvider: AdProvider = mockAdProvider
