use std::{ffi::CString, path::Path, process::Command};

use anyhow::Result;
use fs_extra::{
    dir::{CopyOptions, copy},
    error::ErrorKind,
};
use regex::Regex;

pub fn mount(source: impl AsRef<Path>, target: impl AsRef<Path>) -> Result<()> {
    let target = target.as_ref();
    let source = source.as_ref();
    let source_cstr = CString::new(source.to_str().unwrap_or_default())?;
    let target_cstr = CString::new(target.to_str().unwrap_or_default())?;

    unsafe {
        if libc::mount(
            source_cstr.as_ptr(),
            target_cstr.as_ptr(),
            std::ptr::null(),
            libc::MS_BIND,
            std::ptr::null(),
        ) != 0
        {
            return Err(std::io::Error::last_os_error().into());
        }
    }
    Ok(())
}

/// Folder Copy
/// from: source folder path
/// to: target path
pub fn dir_copys(from: impl AsRef<Path>, to: impl AsRef<Path>) {
    let output = Command::new("cp")
        .arg("-r")
        .arg(from.as_ref())
        .arg(to.as_ref())
        .output()
        .unwrap();

    if !output.status.success() {
        log::error!(
            "copy files failed: stdout: {}, stderr {}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        panic!();
    }
}

/// get packge mount state
/// packge: packge name
pub fn get_mount_state(package: &str) -> Result<bool> {
    let out = Command::new("mount").output()?;
    let stdout = String::from_utf8_lossy(&out.stdout);
    let re_priv_app = Regex::new(format!("/system/priv-app/{}", package).as_str()).unwrap();
    let re_system_app = Regex::new(format!("/system/priv-app/{}", package).as_str()).unwrap();
    if re_priv_app.is_match(&stdout) {
        return Ok(true);
    }
    if re_system_app.is_match(&stdout) {
        return Ok(true);
    }
    return Ok(false);
}

/// get packge data path in =/data
/// packge: packge name
pub fn find_data_path(package: &str) -> Result<String> {
    let out = Command::new("pm").args(&["path", package]).output()?;
    let stdout = String::from_utf8_lossy(&out.stdout);
    let re = Regex::new(r"^package:(.*)").unwrap();
    let caps = match re.captures(&stdout) {
        Some(s) => s,
        None => return Ok(String::new()),
    };
    let mut path = caps[1].to_string();

    path = path.trim_end().trim_end_matches("/base.apk").to_string();
    log::info!("{} path is {}", package, path);

    Ok(path)
}

///umount files
///target: should umount files path
pub fn unmount(target: impl AsRef<Path>) -> Result<()> {
    let target = target.as_ref();

    let target_cstr = CString::new(target.to_str().unwrap_or_default())?;

    unsafe {
        if libc::umount(target_cstr.as_ptr()) != 0 {
            return Err(std::io::Error::last_os_error().into());
        }
    }
    Ok(())
}
