import React from "react"
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    React.createElement("div", {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#C0392B",
        color: "white",
        fontWeight: 700,
        fontSize: 300,
        borderRadius: 128
      },
      children: "L"
    }),
    {
      width: 512,
      height: 512
    }
  )
}
