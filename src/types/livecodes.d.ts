/**
 * Type declarations for livecodes/react
 * @see https://livecodes.io/docs/sdk/react
 */
declare module 'livecodes/react' {
  import type { FC } from 'react';

  export interface LiveCodesConfig {
    script?: {
      language: string;
      content: string;
    };
    markup?: {
      language: string;
      content: string;
    };
    style?: {
      language: string;
      content: string;
    };
    tools?: {
      enabled?: string[];
      active?: string;
      status?: 'open' | 'closed' | 'none';
    };
    [key: string]: unknown;
  }

  export interface Playground {
    run: () => Promise<void>;
    getCode: () => Promise<Record<string, string>>;
    setCode: (code: Record<string, string>) => Promise<void>;
    destroy: () => Promise<void>;
    watch: (event: string, callback: (data: unknown) => void) => void;
  }

  export interface LiveCodesProps {
    config?: LiveCodesConfig;
    params?: Record<string, string>;
    template?: string;
    view?: 'editor' | 'result' | 'split';
    loading?: 'eager' | 'lazy' | 'click';
    className?: string;
    onReady?: (playground: Playground) => void;
  }

  const LiveCodes: FC<LiveCodesProps>;
  export default LiveCodes;
}

declare module 'livecodes' {
  export interface EmbedOptions {
    appUrl?: string;
    config?: Record<string, unknown>;
    headless?: boolean;
    import?: string;
    loading?: 'eager' | 'lazy' | 'click';
    params?: Record<string, string>;
    template?: string;
  }

  export interface Playground {
    run: () => Promise<void>;
    getCode: () => Promise<Record<string, string>>;
    setCode: (code: Record<string, string>) => Promise<void>;
    destroy: () => Promise<void>;
  }

  export function createPlayground(
    container: string | Element,
    options?: EmbedOptions
  ): Promise<Playground>;
}
