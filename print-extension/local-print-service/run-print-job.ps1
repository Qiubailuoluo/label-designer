# 由计划任务在用户会话中调用，读取本次打印请求并执行 send-raw-print.ps1（与手动 CMD 环境一致）
$requestPath = Join-Path $env:TEMP "zpl-print-request.json"
if (-not (Test-Path -LiteralPath $requestPath)) { exit 1 }
try {
    $job = Get-Content -LiteralPath $requestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $printer = $job.printerName
    $zplPath = $job.zplPath
    if (-not $printer -or -not $zplPath) { exit 2 }
    $scriptDir = $PSScriptRoot
    & (Join-Path $scriptDir "send-raw-print.ps1") -PrinterName $printer -FilePath $zplPath
} finally {
    Remove-Item -LiteralPath $requestPath -Force -ErrorAction SilentlyContinue
}
