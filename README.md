# CF-Workers-checkin
![签到](./p.png)

## 使用方法
- 示例项目地址: `qd.google.workers.dev`；
### 检查TG通知
- 访问`https://qd.google.workers.dev/tg`；
### 手动签到
1. 示例机场密码: `password`
2. 访问`https://qd.google.workers.dev/password`；
### 设置自动签到
1. **设置** > **触发事件** > **＋添加** > **Cron 触发器**；
2. **一周中的某一天** > **每天** > **00:00**(推荐修改成任意时间!) > **添加** 即可；

## 变量说明
| 变量名 | 示例 | 必填 | 备注 | 
|--|--|--|--|
| `JC`/`DOMAIN` | `jichangyuming.com` |✅| 机场域名 |
| `ZH`/`USER` | `admin@google.com` |✅| 机场账户邮箱 |
| `MM`/`PASS` | `password` |✅| 机场账户密码 |
| `TGTOKEN` | `6894123456:XXXXXXXXXX0qExVsBPUhHDAbXXX` |❌| 发送TG通知的机器人token | 
| `TGID` | `6946912345` |❌| 接收TG通知的账户数字ID | 
