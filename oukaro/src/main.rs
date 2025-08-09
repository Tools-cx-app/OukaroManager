use std::{collections::HashSet, io::Write, path::Path};

use anyhow::Result;
use env_logger::Builder;
use inotify::{Inotify, WatchMask};

use crate::utils::{find_data_path, get_mount_state, mount, unmount};

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

    config.load_config()?;
    inotify
        .watches()
        .add(Path::new(defs::CONFIG_PATH), WatchMask::MODIFY)?;
    loop {
        inotify.read_events_blocking(&mut [0; 2048])?;
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
            let path = Path::new(path.as_str());
            let remove_state = priv_app_cache.unwrap_or_default().contains(i.as_str());
            log::info!("find {} path", i);
            let state = get_mount_state(i.as_str())?;
            log::info!("the {} is {}", i, if state { "mounted" } else { "unmount" });
            if state {
                continue;
            }
            if !remove_state {
                unmount(Path::new(format!("/system/priv-app/{}", i).as_str()))?;
                continue;
            }
            mount(path, Path::new(format!("/system/priv-app/{}", i).as_str()))?;
        }
        for i in system_app {
            let path = find_data_path(i.clone().as_str())?;
            let path = Path::new(path.as_str());
            let remove_state = system_app_cache.unwrap_or_default().contains(i.as_str());
            log::info!("find {} path", i);
            let state = get_mount_state(i.as_str())?;
            log::info!("the {} is {}", i, if state { "mounted" } else { "unmount" });
            if state {
                continue;
            }
            if !remove_state {
                unmount(Path::new(format!("/system/app/{}", i).as_str()))?;
                continue;
            }
            mount(path, Path::new(format!("/system/app/{}", i).as_str()))?;
        }
    }
}
