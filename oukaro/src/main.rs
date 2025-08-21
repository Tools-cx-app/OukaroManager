use std::{fs, io::Write, os::unix::fs::PermissionsExt, path::Path};

use anyhow::Result;
use env_logger::Builder;
use inotify::{Inotify, WatchMask};

use crate::{
    defs::SYSTEM_PATH,
    utils::{dir_copys, find_data_path, get_mount_state, mount, unmount},
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
    let system_path = Path::new("/system/app");
    let priv_app_path = Path::new("/system/priv-app");

    /// copy system files to module path
    fs::create_dir_all(module_system_path)?;
    fs::create_dir_all(module_system_path)?;
    dir_copys("/system/app", module_system_path.join("app"));
    dir_copys("/system/priv-app", module_system_path.join("priv-app"));
    config.load_config()?;

    inotify
        .watches()
        .add(Path::new(defs::CONFIG_PATH), WatchMask::MODIFY)?;
    loop {
        /// load config
        config.load_config()?;
        let app = config.get();
        let priv_app = app.priv_app;
        let system_app = app.system_app;

        /// add cache
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

            log::info!("copying some files for {}", i);
            fs::set_permissions(path, PermissionsExt::from_mode(755))?;
            fs::copy(
                path,
                module_system_path.join(format!("priv-app/{}/base.apk", i)),
            )?;
            log::info!("mounting {}", i);
            /// mount app to system
            mount(module_system_path.join("priv-app"), priv_app_path)?;
        }
        for i in system_app {
            let path = find_data_path(i.clone().as_str())?;
            if path.is_empty() {
                continue;
            }
            let path = Path::new(path.as_str());
            let remove_state = !system_app_cache
                .clone()
                .unwrap_or_default()
                .contains(i.as_str());
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

            log::info!("copying some files for {}", i);
            fs::set_permissions(path, PermissionsExt::from_mode(755))?;
            fs::copy(path, module_system_path.join(format!("app/{}/base.apk", i)))?;
            log::info!("mounting {}", i);
            /// mount app to system
            mount(module_system_path.join("app"), system_path)?;
        }
        inotify.read_events_blocking(&mut [0; 2048])?;
    }
}
