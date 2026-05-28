param(
  [Parameter(Mandatory = $true)]
  [string]$OriginalPath,

  [Parameter(Mandatory = $true)]
  [string]$RevisedPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputJsonPath
)

$ErrorActionPreference = "Stop"

function Normalize-RevisionText {
  param([string]$Value)
  return (($Value -replace "\r", " " -replace "\n", " ").Trim())
}

$word = $null
$original = $null
$revised = $null
$compare = $null

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0

  $original = $word.Documents.Open((Resolve-Path $OriginalPath).Path)
  $revised = $word.Documents.Open((Resolve-Path $RevisedPath).Path)
  $compare = $word.CompareDocuments(
    $original,
    $revised,
    2,
    1,
    $true,
    $true,
    $true,
    $true,
    $true,
    $true,
    $true,
    $true,
    $true,
    $true,
    "Word",
    $true
  )

  $records = @()
  for ($index = 1; $index -le $compare.Revisions.Count; $index++) {
    $revision = $compare.Revisions.Item($index)
    $records += [PSCustomObject]@{
      index = $index
      type = [int]$revision.Type
      text = (Normalize-RevisionText $revision.Range.Text)
    }
  }

  $directory = Split-Path -Parent $OutputJsonPath
  if (-not [string]::IsNullOrWhiteSpace($directory)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }

  $payload = [PSCustomObject]@{
    generated_at = (Get-Date).ToString("o")
    original = (Resolve-Path $OriginalPath).Path
    revised = (Resolve-Path $RevisedPath).Path
    revision_count = $records.Count
    revisions = $records
  }

  $payload | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $OutputJsonPath
}
finally {
  if ($compare -ne $null) {
    try { $compare.Close([ref]0) } catch {}
  }
  if ($revised -ne $null) {
    try { $revised.Close([ref]0) } catch {}
  }
  if ($original -ne $null) {
    try { $original.Close([ref]0) } catch {}
  }
  if ($word -ne $null) {
    try { $word.Quit() } catch {}
  }
  Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force
}
