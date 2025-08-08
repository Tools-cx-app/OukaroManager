use std::{ffi::CString, fs, path::Path, process::Command};

use anyhow::Result;
use regex::Regex;

pub fn mount(fs_type: &str, source: &str, target: impl AsRef<Path>, flags: u64) -> Result<()> {
    let target = target.as_ref();
    fs::create_dir_all(target)?;

    let fs_type_cstr = CString::new(fs_type)?;
    let source_cstr = CString::new(source)?;
    let target_cstr = CString::new(target.to_str().unwrap_or_default())?;

    unsafe {
        if libc::mount(
            source_cstr.as_ptr(),
            target_cstr.as_ptr(),
            fs_type_cstr.as_ptr(),
            flags as u64,
            std::ptr::null(),
        ) != 0
        {
            return Err(std::io::Error::last_os_error().into());
        }
    }
    Ok(())
}

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
