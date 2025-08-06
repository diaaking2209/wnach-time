import type { SVGProps } from "react";

export function RockstarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 0L9.41 8.59H0l7.24 5.3L4.59 24l7.41-5.83L19.41 24l-2.65-10.11L24 8.59h-9.41L12 0z" />
    </svg>
  );
}
