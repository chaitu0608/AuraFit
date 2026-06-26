import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aurafit.app',
  appName: 'AuraFit',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#101317',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
