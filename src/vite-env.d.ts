/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      alt?: string
      'camera-controls'?: boolean
      'auto-rotate'?: boolean
      'interaction-prompt'?: string
      exposure?: string
      'shadow-intensity'?: string
    }
  }
}
