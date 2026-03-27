import * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { 
        name?: string;
        size?: string;
        color?: string;
        class?: string;
      };
    }
  }
}
