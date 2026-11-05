import { ImageResponse } from "next/og";

export const alt = "Mythos — apparel in monochrome";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 50% 40%, #1c1c1c 0%, #050505 78%)",
          color: "#f5f5f5",
        }}
      >
        <div
          style={{
            fontSize: 176,
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: 1,
            letterSpacing: "-0.045em",
          }}
        >
          Mythos
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 20,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "#a3a3a3",
          }}
        >
          Apparel, in monochrome
        </div>
      </div>
    ),
    size,
  );
}
