use std::{collections::HashSet, fs, io::Write, os::unix::fs::PermissionsExt, path::Path};

use anyhow::Result;
use env_logger::Builder;
use fs_extra::dir::{self, CopyOptions};
use inotify::{Inotify, WatchMask};

use crate::{
    defs::SYSTEM_PATH,
    utils::{find_data_path, get_mount_state, mount, unmount},
};

mod config;
mod defs;
mod utils;

fn main() -> Result<()> {
    let mut builder = Builder::new();
    builder.format(|buf, record| {
        let local_time = chrono::Local::now();
        let time_str = local_time.format("%Y-%m-%d %H:%M:%S%.3f").to_string();

        writeln!(
            buf,
            "[{}] [{}] {} {}",
            time_str,
            record.level(),
            record.target(),
            record.args()
        )
    });
    builder.filter_level(log::LevelFilter::Info).init();

    let mut config = config::Config::new();
    let mut inotify = Inotify::init()?;
    let mut priv_app_cache = None;
    let mut system_app_cache = None;
    let module_system_path = Path::new(SYSTEM_PATH);
    let mut copy_options = CopyOptions::new();
    copy_options.overwrite = true;

    inotify
        .watches()
        .add(Path::new(defs::CONFIG_PATH), WatchMask::MODIFY)?;
    loop {
        config.load_config()?;
        let app = config.get();
        let priv_app = app.priv_app;
        let system_app = app.system_app;

        if let None = system_app_cache.clone()
            && let None = priv_app_cache.clone()
        {
            system_app_cache = Some(system_app.clone());
            priv_app_cache = Some(priv_app.clone());
        }

        for i in priv_app {
            let path = find_data_path(i.clone().as_str())?;
            if path.is_empty() {
                continue;
            }
            let path = Path::new(path.as_str());
            let remove_state = !priv_app_cache
                .clone()
                .unwrap_or_default()
                .contains(i.as_str());
            let system_path = format!("/system/priv-app/{}", i);
            let system_path = Path::new(system_path.as_str());
            let state = get_mount_state(i.as_str())?;

            log::info!("find {} path", i);
            log::info!("the {} is {}", i, if state { "mounted" } else { "unmount" });

            if state {
                continue;
            }
            if remove_state {
                unmount(system_path)?;
                continue;
            }

            fs::create_dir_all(module_system_path.join(format!("system/priv-app/{}", i)))?;
            fs::set_permissions(
                module_system_path.join(format!("system/priv-app/{}", i)),
                PermissionsExt::from_mode(755),
            )?;
            dir::copy(
                path,
                module_system_path.join(format!("system/app/{}", i)),
                &copy_options,
            )?;
            mount(module_system_path, system_path)?;
        }
        for i in system_app {
            let path = find_data_path(i.clone().as_str())?;
            if path.is_empty() {
                continue;
            }
            let path = Path::new(path.as_str());
            let remove_state = !priv_app_cache
                .clone()
                .unwrap_or_default()
                .contains(i.as_str());
            let system_path = format!("/system/app/{}", i);
            let system_path = Path::new(system_path.as_str());
            let state = get_mount_state(i.as_str())?;

            log::info!("find {} path", i);
            log::info!("the {} is {}", i, if state { "mounted" } else { "unmount" });

            if state {
                continue;
            }
            if remove_state {
                unmount(system_path)?;
                continue;
            }

            fs::create_dir_all(module_system_path.join(format!("system/app/{}", i)))?;
            fs::set_permissions(
                module_system_path.join(format!("system/priv-app/{}", i)),
                PermissionsExt::from_mode(755),
            )?;
            dir::copy(
                path,
                module_system_path.join(format!("system/app/{}", i)),
                &copy_options,
            )?;
            mount(module_system_path, system_path)?;
        }
        inotify.read_events_blocking(&mut [0; 2048])?;
    }
}
