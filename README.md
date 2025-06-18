# 📱 OukaroManager

[![Build Status](https://github.com/OukaroMF/OukaroManager/workflows/Build%20KernelSU%20Module/badge.svg)](https://github.com/OukaroMF/OukaroManager/actions)
[![License: Anti-996](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/kattgu7/Anti-996-License)
[![KernelSU](https://img.shields.io/badge/KernelSU-Compatible-green.svg)](https://github.com/tiann/KernelSU)
[![WebUIX](https://img.shields.io/badge/WebUIX-Compatible-orange.svg)](https://github.com/KOWX712/WebUIX)

一个KernelSU模块，提供简单的WebUI来将普通Android应用转换为系统应用 — 无需ADB，无需root shell，只需点击。

A KernelSU module that provides a simple WebUI to convert regular Android apps to system apps — no ADB, no root shell, just click.

## ✨ 功能特性 | Features

- 🧱 **将普通应用转换为系统应用** | **Convert regular apps to system apps**
- 📁 **支持 `/system/app/` 和 `/system/priv-app/` 两种模式** | **Supports both `/system/app/` and `/system/priv-app/` modes**
- 🌐 **WebUI 兼容界面** — 通过KernelSU Manager、MMRL或WebUIX portable控制 | **WebUI compatible interface** — Control via KernelSU Manager, MMRL or WebUIX portable
- 🛠️ **与KernelSU的magic mount协同工作**，无需手动重新挂载/system | **Works with KernelSU's magic mount**, no manual /system remounting required
- 🌍 **多语言支持** — 支持简体中文和英文 | **Multi-language support** — Supports Simplified Chinese and English

## 📦 工作原理 | How It Works

该模块使用KernelSU的overlay挂载系统将选定的用户应用注入到系统分区中，模拟它们作为预装应用的行为。

This module uses KernelSU's overlay mount system to inject selected user applications into the system partition, simulating their behavior as pre-installed apps.

## 🚀 安装 | Installation

1. **下载** 最新版本的模块 | **Download** the latest version of the module
2. **安装** 使用KernelSU Manager | **Install** using KernelSU Manager
3. **重启** 您的设备 | **Reboot** your device
4. **访问** 通过KernelSU Manager、MMRL或WebUIX portable访问WebUI | **Access** WebUI via KernelSU Manager, MMRL or WebUIX portable

## 🖥️ 使用方法 | Usage

1. 打开KernelSU Manager（如果KernelSU Manager不可用，可使用MMRL/WebUIX portable） | Open KernelSU Manager (if KernelSU Manager is unavailable, use MMRL/WebUIX portable)
2. 导航到OukaroManager模块WebUI | Navigate to OukaroManager module WebUI
3. 选择要转换的应用 | Select the apps you want to convert
4. 在 `/system/app/` 或 `/system/priv-app/` 放置之间选择 | Choose between `/system/app/` or `/system/priv-app/` placement
5. 点击转换并在提示时重启 | Click convert and reboot when prompted

## ⚠️ 系统要求 | System Requirements

- **KernelSU** 已安装并正常工作 | **KernelSU** installed and working
- **Android设备** 具有root权限 | **Android device** with root access
- **KernelSU Manager**（推荐）或 **MMRL**/**WebUIX portable** 用于WebUI访问 | **KernelSU Manager** (recommended) or **MMRL**/**WebUIX portable** for WebUI access

## 🔧 技术细节 | Technical Details

- 使用KernelSU的magic mount overlay系统 | Uses KernelSU's magic mount overlay system
- 无直接系统分区修改 | No direct system partition modifications
- 通过模块移除可逆转更改 | Reversible changes through module removal
- 兼容大多数Android版本 | Compatible with most Android versions
- **WebUIX兼容**，可增强模块管理体验 | **WebUIX compatible** for enhanced module management experience

## 📱 WebUI访问选项 | WebUI Access Options

该模块支持 **WebUIX** 标准，可通过多种方式访问：
This module supports the **WebUIX** standard and can be accessed through multiple ways:

### 主要方式（推荐） | Primary Method (Recommended)
- **KernelSU Manager** - 内置对KernelSU模块的WebUI支持 | Built-in WebUI support for KernelSU modules

### 替代方式 | Alternative Options
- **MMRL** - 现代模块仓库加载器，支持WebUI | Modern module repository loader with WebUI support
- **WebUIX Portable** - 独立的WebUI查看器 | Standalone WebUI viewer

## 🌍 支持的语言 | Supported Languages

- 🇺🇸 **English** - 完整支持 | Full support
- 🇨🇳 **简体中文** - 完整支持 | Full support

## 📋 项目结构 | Project Structure

```
OukaroManager/
├── module.prop           # 模块配置 | Module configuration
├── post-fs-data.sh      # 启动脚本（早期）| Boot script (early)
├── service.sh           # 服务脚本（后期）| Service script (late)
├── action.sh            # 动作脚本 | Action script
├── webroot/             # WebUI文件 | WebUI files
│   ├── index.html       # 主页面 | Main page
│   ├── scripts.js       # JavaScript逻辑 | JavaScript logic
│   ├── styles.css       # 样式表 | Stylesheets
│   ├── locales/         # 翻译文件 | Translation files
│   │   ├── en.json      # 英文翻译 | English translations
│   │   └── zh.json      # 中文翻译 | Chinese translations
│   └── assets/          # 静态资源 | Static assets
└── README.md            # 项目说明 | Project documentation
```

## 🔄 转换模式 | Conversion Modes

### Mode 1: `/system/app/`
标准系统应用位置，具有基本系统权限。适合大多数普通应用。
Standard system app location with basic system privileges. Suitable for most regular apps.

### Mode 2: `/system/priv-app/`
特权系统应用位置，具有增强的系统权限。适合需要特殊权限的应用。
Privileged system app location with enhanced system privileges. Suitable for apps requiring special permissions.

## 🛡️ 安全说明 | Security Notes

- 转换应用为系统应用会赋予它们额外的权限 | Converting apps to system apps grants them additional permissions
- 请仅转换您信任的应用 | Only convert apps you trust
- 备份重要数据，以防意外情况 | Backup important data in case of unexpected issues
- 可以随时通过WebUI或移除模块来还原更改 | Changes can be reverted anytime through WebUI or module removal

## 🐛 故障排除 | Troubleshooting

### WebUI无法访问 | WebUI Not Accessible
1. 确保KernelSU Manager已更新到最新版本 | Ensure KernelSU Manager is updated to the latest version
2. 尝试使用MMRL或WebUIX portable作为替代 | Try using MMRL or WebUIX portable as alternatives
3. 检查模块是否正确安装并启用 | Check if the module is properly installed and enabled

### 应用转换失败 | App Conversion Fails
1. 确保有足够的存储空间 | Ensure sufficient storage space
2. 检查应用是否已经是系统应用 | Check if the app is already a system app
3. 尝试重启设备后再次转换 | Try rebooting the device and converting again

### 转换后应用无法正常工作 | Apps Not Working After Conversion
1. 尝试将应用还原为用户应用 | Try reverting the app back to user app
2. 清除应用数据和缓存 | Clear app data and cache
3. 检查应用是否与您的Android版本兼容 | Check if the app is compatible with your Android version

## 🤝 贡献 | Contributing

欢迎贡献代码、报告问题或提出改进建议！
We welcome contributions! Please feel free to:
- 报告错误和问题 | Report bugs and issues
- 建议新功能 | Suggest new features
- 提交拉取请求 | Submit pull requests
- 改进文档 | Improve documentation

## 📞 联系方式 | Contact

- **GitHub**: [GitHub.com/OukaroMF/OukaroManager](https://github.com/OukaroMF/OukaroManager)
- **Telegram**: [@MF_1f1e33](https://t.me/MF_1f1e33) | [@OukaroSU](https://t.me/OukaroSU)
- **联系开发者 | Contact Developer**: [@MFnotMtF](https://t.me/MFnotMtF)

## 🙏 致谢 | Acknowledgments

- [KernelSU项目](https://github.com/tiann/KernelSU) - 提供强大的内核级root解决方案 | Providing powerful kernel-level root solution
- [KOWX712/Tricky-Addon-Update-Target-List](https://github.com/KOWX712/Tricky-Addon-Update-Target-List) - WebUI设计参考 | WebUI design reference
- 所有测试者和贡献者 | All testers and contributors

## ⚠️ 免责声明 | Disclaimer

- 此模块会修改系统行为 - 使用风险自负 | This module modifies system behavior - use at your own risk
- 使用前请务必备份设备 | Always backup your device before using
- 某些应用可能无法作为系统应用正常工作 | Some apps may not function properly as system apps
- 我们不对设备的任何损坏承担责任 | We are not responsible for any damage to your device

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！ | If this project helps you, please give us a star!

---

## 📜 许可证 | License

本项目采用 **Anti-996 License Version 1.0** 许可证。
This project is licensed under the **Anti-996 License Version 1.0**.

[![Anti 996](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/kattgu7/Anti-996-License)

### 关于 Anti-996 License | About Anti-996 License

Anti-996 License 是一个开源许可证，旨在保护开发者的劳动权益，反对过度加班的"996"工作制度（上午9点到晚上9点，一周6天）。

The Anti-996 License is an open source license designed to protect developers' labor rights and oppose the excessive overtime "996" work system (9 AM to 9 PM, 6 days a week).

### 主要条款 | Main Terms

此许可证的主要条款包括：
The main terms of this license include:

1. **许可授予** | **License Grant**：允许任何个人或法律实体免费使用、复制、修改、发布和分发本许可作品 | Allows any individual or legal entity to freely use, copy, modify, publish and distribute this licensed work
2. **劳动法合规要求** | **Labor Law Compliance**：使用者必须严格遵守所在司法管辖区的所有相关劳动和就业法律法规 | Users must strictly comply with all relevant labor and employment laws and regulations in their jurisdiction
3. **员工权益保护** | **Employee Rights Protection**：禁止以任何方式诱导或强迫员工放弃其劳动权益 | Prohibits inducing or forcing employees to give up their labor rights in any way

### 为什么选择 Anti-996 License？ | Why Choose Anti-996 License?

- ✊ **保护开发者权益** | **Protect Developer Rights**：确保使用本软件的公司遵守合理的工作时间 | Ensure companies using this software comply with reasonable working hours
- 🌟 **促进健康工作环境** | **Promote Healthy Work Environment**：反对过度加班，提倡工作与生活的平衡 | Oppose excessive overtime and advocate work-life balance
- 🔒 **法律约束力** | **Legal Binding**：通过许可证条款确保劳动法的遵守 | Ensure compliance with labor laws through license terms

### 了解更多 | Learn More

- [Anti-996 License 项目 | Anti-996 License Project](https://github.com/kattgu7/Anti-996-License)
- [996.ICU](https://996.icu/)

---

**注意** | **Notice**：通过使用本项目，您同意遵守 Anti-996 License 的所有条款和条件。 | By using this project, you agree to comply with all terms and conditions of the Anti-996 License.
