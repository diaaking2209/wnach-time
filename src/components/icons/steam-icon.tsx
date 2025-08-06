import type { SVGProps } from "react";

export function SteamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12.003 2.001a10.002 10.002 0 1 0 0 20.004 10.002 10.002 0 0 0 0-20.004Zm0 17.503a7.502 7.502 0 1 1 0-15.004 7.502 7.502 0 0 1 0 15.004Z" />
      <path d="M12.003 7.7a4.322 4.322 0 1 0 0 8.644 4.322 4.322 0 0 0 0-8.644Zm-1.57 5.176-1.554.9-1.93-3.292 1.555-.902a2.823 2.823 0 0 1 1.93 3.294Zm3.128-.013a1.45 1.45 0 1 1-2.495-1.46l3.431-1.986a.545.545 0 0 1 .74.64l-1.676 2.806Z" />
    </svg>
  );
}
