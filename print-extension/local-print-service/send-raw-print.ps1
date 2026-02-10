# 向 Windows 打印机发送原始 ZPL（与 Python win32print 流程一致：OpenPrinter -> StartDocPrinter(1, ("ZPL Label", None, "RAW")) -> StartPage -> WritePrinter(bytes) -> EndPage -> EndDoc -> Close）
# 用法: .\send-raw-print.ps1 -PrinterName "打印机名称" -FilePath "C:\path\to\zpl.zpl"
param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$FilePath
)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [DllImport("winspool.Drv", EntryPoint="OpenPrinterW", CharSet=CharSet.Unicode)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
  [DllImport("winspool.Drv", EntryPoint="ClosePrinter")]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterW", CharSet=CharSet.Unicode)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int Level, ref DOC_INFO_1 pDocInfo);
  [DllImport("winspool.Drv", EntryPoint="EndDocPrinter")]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartPagePrinter")]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="EndPagePrinter")]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="WritePrinter")]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern uint GetLastError();
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct DOC_INFO_1 {
    public string pDocName;
    public string pOutputFile;
    public string pDataType;
  }
  public static string SendBytesToPrinter(string printerName, byte[] bytes) {
    if (bytes == null || bytes.Length == 0) return "ZPL 数据为空";
    IntPtr hPrinter = IntPtr.Zero;
    DOC_INFO_1 di = new DOC_INFO_1();
    di.pDocName = "ZPL Label";
    di.pOutputFile = null;  /* None = 打印到打印机，与 Python win32print 一致 */
    di.pDataType = "RAW";
    if (!OpenPrinter(printerName.Trim(), out hPrinter, IntPtr.Zero)) return "OpenPrinter 失败，错误码: " + GetLastError();
    if (!StartDocPrinter(hPrinter, 1, ref di)) { uint err = GetLastError(); ClosePrinter(hPrinter); return "StartDocPrinter 失败: " + err; }
    if (!StartPagePrinter(hPrinter)) { EndDocPrinter(hPrinter); ClosePrinter(hPrinter); return "StartPagePrinter 失败"; }
    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
    int written = 0;
    bool ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out written);
    Marshal.FreeCoTaskMem(pUnmanagedBytes);
    EndPagePrinter(hPrinter);
    EndDocPrinter(hPrinter);
    System.Threading.Thread.Sleep(400);
    ClosePrinter(hPrinter);
    if (!ok) return "WritePrinter 失败，错误码: " + GetLastError();
    if (written != bytes.Length) return "WritePrinter 未写满: 期望 " + bytes.Length + " 实际 " + written;
    return null;
  }
}
"@
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
$err = [RawPrinter]::SendBytesToPrinter($PrinterName, $bytes)
if ($err) { throw $err }
