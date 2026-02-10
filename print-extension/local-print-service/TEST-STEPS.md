# 系统打印机不出纸时的下一步测试

Python 能出纸、界面选系统打印机不出纸时，按下面步骤隔离是「脚本问题」还是「Node 调用方式」问题。

---

## 步骤 1：手动跑 PowerShell 脚本（和 Python 用同一份 ZPL）

在**你平时能跑通 Python 打印的同一台电脑、同一用户**下：

1. 打开 **CMD 或 PowerShell**，进入本目录：
   ```bash
   cd D:\MyRFID\label-designer\print-extension\local-print-service
   ```

2. 本目录下已有 `test.zpl`（内容与常见 Python 测试 ZPL 一致）。执行：
   ```bash
   powershell -NoProfile -ExecutionPolicy Bypass -File send-raw-print.ps1 -PrinterName "ZD621R300dpi" -FilePath "test.zpl"
   ```
   把 `ZD621R300dpi` 换成你本机实际的打印机名（和 Python 里用的完全一致）。

3. 看结果：
   - **若报错**：把完整报错贴出来，说明是脚本或环境问题。
   - **若无报错且队列出现任务、出纸**：说明脚本本身 OK，问题在 **Node 调用脚本的方式**（会话/工作目录/环境等），再按步骤 2 做。
   - **若无报错但队列仍无任务、不出纸**：说明在当前环境下 PowerShell 脚本和 Python 行为不一致，需要继续对比 API 或驱动表现。

---

## 步骤 2：若步骤 1 能出纸，再测「由 Node 调用」

保持 `node server.js` 在运行，在浏览器里选系统打印机打一张，同时：

- 看运行 `node server.js` 的终端里是否有 `[打印] 已通过驱动队列提交`。
- 看队列是否出现任务、是否出纸。

若步骤 1 能出纸、步骤 2 不能，则很可能是 **Node 子进程的会话或环境** 与直接手动跑 PowerShell 不同（例如会话 ID、工作目录、用户上下文）。下一步可以尝试：
- 用 `cmd /c` 包一层再调 PowerShell，或
- 把「打印」做成由本地一个小程序/脚本在用户会话里跑（由 Node 触发），再根据你的部署方式选方案。

---

## 步骤 3：确认打印机名一致

在 PowerShell 里执行：

```powershell
Get-Printer | Select-Object Name
```

列表里的名字（含大小写、空格）必须和脚本参数、Python 里用的完全一致。例如若显示为 `ZD621R300dpi`，则 `-PrinterName "ZD621R300dpi"` 不要多空格或改名。

---

把 **步骤 1** 的结果（有无报错、队列有无任务、是否出纸）发给我，再决定下一步是改 Node 调用方式还是继续查脚本/驱动。
