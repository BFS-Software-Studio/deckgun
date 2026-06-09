import { getStroke } from "perfect-freehand";

// Turn an array of input points ([x, y] or [x, y, pressure]) into a filled SVG
// path string using perfect-freehand for a smooth, natural stroke.
export function strokePath(points: number[][], size: number): string {
  const outline = getStroke(points, {
    size,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: true,
  });
  return svgFromOutline(outline);
}

function svgFromOutline(stroke: number[][]): string {
  if (stroke.length === 0) return "";
  const d = stroke.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", stroke[0][0], stroke[0][1], "Q"],
  );
  d.push("Z");
  return d.join(" ");
}
