use std::{path::Path, process::Command};

use anyhow::Result;
use regex::Regex;

pub fn mount() {}

pub fn get_mount_state(package: &str) -> Result<bool> {
    let out = Command::new("mount").output()?;
    let stdout = String::from_utf8_lossy(&out.stdout);
    let re = Regex::new(format!("/system/priv-app/.*{}.*bind", package).as_str()).unwrap();

    if re.is_match(&stdout) {
        return Ok(true);
    }
    return Ok(false);
}

pub fn find_data_path(package: &str) -> Result<String> {
    let out = Command::new("pm")
        .args(&["pm", "list", "packages", "-f", package])
        .output()?;

    let stdout = String::from_utf8_lossy(&out.stdout);

    // 2. 取第一行
    let first_line = stdout.lines().next().unwrap_or_default();

    // 3. 用正则去掉前缀 “package:” 和后缀 “=包名”
    let re = Regex::new(r"^package:(.+?)=.*$").unwrap();
    let caps = re.captures(first_line).unwrap();
    let mut path = caps[1].to_string();

    // 去掉可能的 \r 或 \n
    path = path.trim_end().to_string();

    Ok(path)
}
