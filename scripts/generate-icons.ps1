param(
  [string]$SourcePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class IconInterop {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern bool DestroyIcon(IntPtr handle);
}
"@

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-IconBitmap {
  param(
    [int]$Size,
    [string]$ImagePath
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  if ($ImagePath) {
    $source = [System.Drawing.Bitmap]::FromFile($ImagePath)
    try {
      $threshold = 248
      $minX = $source.Width
      $minY = $source.Height
      $maxX = -1
      $maxY = -1

      for ($y = 0; $y -lt $source.Height; $y += 1) {
        for ($x = 0; $x -lt $source.Width; $x += 1) {
          $pixel = $source.GetPixel($x, $y)
          $isVisible = $pixel.A -gt 24
          $isNotWhite = $pixel.R -lt $threshold -or $pixel.G -lt $threshold -or $pixel.B -lt $threshold

          if ($isVisible -and $isNotWhite) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
          }
        }
      }

      if ($maxX -lt 0 -or $maxY -lt 0) {
        $minX = 0
        $minY = 0
        $maxX = $source.Width - 1
        $maxY = $source.Height - 1
      }

      $padding = [Math]::Round($Size * 0.08)
      $contentWidth = ($maxX - $minX) + 1
      $contentHeight = ($maxY - $minY) + 1
      $availableWidth = $Size - ($padding * 2)
      $availableHeight = $Size - ($padding * 2)
      $scale = [Math]::Min($availableWidth / $contentWidth, $availableHeight / $contentHeight)
      $drawWidth = [Math]::Ceiling($contentWidth * $scale)
      $drawHeight = [Math]::Ceiling($contentHeight * $scale)
      $offsetX = [Math]::Floor(($Size - $drawWidth) / 2)
      $offsetY = [Math]::Floor(($Size - $drawHeight) / 2)

      $graphics.Clear([System.Drawing.Color]::White)
      $sourceRect = New-Object System.Drawing.Rectangle $minX, $minY, $contentWidth, $contentHeight
      $destRect = New-Object System.Drawing.Rectangle $offsetX, $offsetY, $drawWidth, $drawHeight

      $graphics.DrawImage(
        $source,
        $destRect,
        $sourceRect,
        [System.Drawing.GraphicsUnit]::Pixel
      )
    } finally {
      $source.Dispose()
      $graphics.Dispose()
    }

    return $bitmap
  }

  $dark = [System.Drawing.ColorTranslator]::FromHtml("#111B21")
  $green = [System.Drawing.ColorTranslator]::FromHtml("#25D366")
  $greenSoft = [System.Drawing.ColorTranslator]::FromHtml("#6BFFA5")
  $padding = [Math]::Round($Size * 0.12)
  $cardSize = $Size - ($padding * 2)
  $radius = [Math]::Round($Size * 0.22)

  $backgroundPath = New-RoundedRectPath -X $padding -Y $padding -Width $cardSize -Height $cardSize -Radius $radius
  $graphics.FillPath((New-Object System.Drawing.SolidBrush $dark), $backgroundPath)

  $stripeHeight = [Math]::Round($Size * 0.17)
  $stripeWidth = [Math]::Round($cardSize * 0.64)
  $stripeY = $padding + $cardSize - $stripeHeight - [Math]::Round($Size * 0.06)
  $stripeX = $padding + [Math]::Round($Size * 0.11)
  $stripePath = New-RoundedRectPath -X $stripeX -Y $stripeY -Width $stripeWidth -Height $stripeHeight -Radius ($stripeHeight / 2)
  $graphics.FillPath((New-Object System.Drawing.SolidBrush $green), $stripePath)

  $dotSize = [Math]::Round($Size * 0.15)
  $dotX = $padding + $cardSize - $dotSize - [Math]::Round($Size * 0.11)
  $dotY = $padding + [Math]::Round($Size * 0.16)
  $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $greenSoft), $dotX, $dotY, $dotSize, $dotSize)

  $backgroundPath.Dispose()
  $stripePath.Dispose()
  $graphics.Dispose()

  return $bitmap
}

function Save-Png {
  param(
    [string]$OutputPath,
    [int]$Size,
    [string]$ImagePath
  )

  $directory = Split-Path -Parent $OutputPath
  if (!(Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap = New-IconBitmap -Size $Size -ImagePath $ImagePath
  try {
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
}

function Save-Ico {
  param(
    [string]$OutputPath,
    [string]$ImagePath
  )

  $directory = Split-Path -Parent $OutputPath
  if (!(Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap = New-IconBitmap -Size 64 -ImagePath $ImagePath
  $iconHandle = $bitmap.GetHicon()

  try {
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    $stream = [System.IO.File]::Create($OutputPath)
    try {
      $icon.Save($stream)
    } finally {
      $stream.Dispose()
      $icon.Dispose()
    }
  } finally {
    [IconInterop]::DestroyIcon($iconHandle) | Out-Null
    $bitmap.Dispose()
  }
}

$resolvedSource = $null
if ($SourcePath) {
  $resolvedSource = (Resolve-Path $SourcePath).Path
}

$targets = @(
  @{ Path = "public/icons/icon-64.png"; Size = 64 },
  @{ Path = "public/icons/icon-128.png"; Size = 128 },
  @{ Path = "public/icons/apple-icon-180.png"; Size = 180 },
  @{ Path = "public/pwa/icon-192.png"; Size = 192 },
  @{ Path = "public/pwa/icon-512.png"; Size = 512 }
)

foreach ($target in $targets) {
  Save-Png -OutputPath $target.Path -Size $target.Size -ImagePath $resolvedSource
}

Save-Ico -OutputPath "public/favicon.ico" -ImagePath $resolvedSource
