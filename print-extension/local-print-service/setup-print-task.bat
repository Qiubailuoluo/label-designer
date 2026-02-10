@echo off
chcp 65001 >nul
set "PSSCRIPT=%~dp0run-print-job.ps1"
schtasks /create /tn "ZPLPrintFromNode" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"%PSSCRIPT%\"" /sc once /st 00:00 /f
if %errorlevel% equ 0 (
    echo 计划任务 ZPLPrintFromNode 已创建，系统打印机打印将使用此任务。
) else (
    echo 创建失败，请以管理员身份重试或检查是否有安全软件拦截。
)
pause
