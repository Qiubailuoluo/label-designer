# 向 Windows 端口直写原始数据（如 \\.\USB001），绕过驱动/假队列
# 用法: .\send-raw-to-port.ps1 -PortName "USB001" -FilePath "C:\path\to\zpl.zpl"
param(
  [Parameter(Mandatory=$true)][string]$PortName,
  [Parameter(Mandatory=$true)][string]$FilePath
)
$ErrorActionPreference = 'Stop'
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$path = "\\\.\$PortName"
try {
  # 使用 Open 写入设备流，Flush 后短暂延迟再关闭，提高 USB 设备实际接收概率
  $fs = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
  $fs.Write($bytes, 0, $bytes.Length)
  $fs.Flush($true)
  Start-Sleep -Milliseconds 400
  $fs.Close()
} catch {
  throw "直写端口 $PortName 失败: $($_.Exception.Message)"
}
