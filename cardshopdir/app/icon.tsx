import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(135deg, #3d3d3d, #171717)",
        borderRadius: 5,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          width: 7,
          height: 16,
          borderRadius: 3,
          backgroundColor: "#f2f2f2",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 17,
          top: 8,
          width: 7,
          height: 11,
          borderRadius: 3,
          backgroundColor: "#f2f2f2",
        }}
      />
    </div>,
    { ...size }
  )
}
