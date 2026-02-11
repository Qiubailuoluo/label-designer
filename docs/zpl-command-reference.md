# ZPL 指令参考与测试说明

本项目中 ZPL 由 `src/views/connect-print/utils/zpl-generator.ts` 生成。格式已与《ZPL 核心指令快速查阅手册》对齐，便于对照真机测试并反馈修正。

## 官方文档（Zebra）

- **ZPL 命令总览**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands.html  
- **^A（字体）**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands/r-zpl-a.html  
- **^BC（Code 128）**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands/r-zpl-bc.html  
- **^BQ（QR 码）**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands/r-zpl-bq.html  
- **^BY（条码默认参数）**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands/r-zpl-by.html  
- **^B3（Code 39）**: https://docs.zebra.com/us/en/printers/software/zpl-pg/c-zpl-zpl-commands/r-zpl-b3.html  

## 当前生成格式（与快速查阅手册一致）

| 元素类型 | 当前输出示例 | 手册对应 |
|----------|--------------|----------|
| **文本** | `^FTx,y^A0N/^A@N,h,w[,字体名]^FH\^CI28^FD...^FS^CI27` | ^FT 定位；^A0 默认/^A@ 按文件名；^CI28 UTF-8 |
| **变量** | 同上，^FNn 或 ^FD{{变量名}}^FS | 与文本共用 ^FT+^A+^CI28 |
| **Code 128** | `^BY2,2^BCN,height,Y,N,N,A^FD...^FS` | ^BCo,h,f,g,e,m（f=可读行 Y，m=A 自动） |
| **Code 39** | `^BY2,2^B3N,N,height,Y,N^FD...^FS` | ^B3o,e,h,f,g（e=Mod43 N，f=可读行 Y） |
| **QR** | `^BQN,2,mag,Q^FDMM,data^FS` | ^BQa,b,c,d（b=2 增强, d=Q 纠错） |

- **^RO**：旋转 N/R/I/B 由元素 `rotation` 换算。  
- 坐标与尺寸均按 `config.dpi` 换算为 dots。条码更多参数说明见《ZPL 核心指令快速查阅手册》。

## 字体（对齐官方示例）

- **ZEBRA 0**：`^A0N,height,width`（内置默认）
- **ZEBRA SimSun**：`^A@N,height,width,SIMSUN.TTF`（按字体文件名）
- **ZEBRA Swiss Unicode**：`^A@N,height,width,TT0003M_`
- 文本前加 `^FH\^CI28`、后加 `^CI27` 以支持 UTF-8/中文。
- **RFID 读取打印**：按成功示例，先 `^FT x,y ^A0N,h,w ^FNn ^FS` 定义位置，再 `^FNn^RFR,...^FS` 读取到该字段。TID=^FN1^RFR,H,0,12,2；EPC=^FN2^RFR,H,2,16,1；User Data=^FN3^RFR,U,0,32,1。打印 ^FN 时不使用 ^CI28/^CI27。
- **RFID 写入 EPC**：`^RS8` 后 `^RFW,H,1,12^FD十六进制^FS`。TID 出厂不可写；User Data 用 ^RFW,U,0,len,1。

若打印机字体路径或文件名不同（如需 R:SIMSUN.TTF），可反馈后改 `getZPLFontCommand`。

## 请您测试后反馈

建议在真实 Zebra 打印机或 Zebra 官方 ZPL 预览工具上测试：

1. **文本**：不同 ZEBRA 字体（0/D/E）是否正确；若不对，请提供机型 + 正确 ^A 示例。  
2. **条码**：Code 128 / Code 39 是否可识读；^BY 的宽高比、高度是否需要调整。  
3. **QR**：^BQ 的 magnification、纠错等级、^FD 是否需用 QA 等其它格式。

把「期望的 ZPL 片段」或「当前错误现象 + 机型」发给我后，我会按你的测试结果精确修改 `zpl-generator.ts`。
