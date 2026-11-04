import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "suido-board": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { grid?: string; level?: string; hints?: boolean; chips?: boolean; lang?: string; theme?: string };
    }
  }
}
