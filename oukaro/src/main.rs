use std::path::Path;

use anyhow::Result;
use inotify::{Inotify, WatchMask};

use crate::utils::{find_data_path, get_mount_state, mount};

mod config;
mod defs;
mod utils;

fn main() -> Result<()> {
    let mut config = config::Config::new();
    let mut inotify = Inotify::init()?;

    config.load_config()?;
    inotify
        .watches()
        .add(Path::new(defs::CONFIG_PATH), WatchMask::MODIFY)?;
    loop {
        inotify.read_events_blocking(&mut [0; 2048])?;
        config.load_config()?;
        for i in config.get() {
            let path = find_data_path(i.clone().as_str())?;
            let path = Path::new(path.as_str());
            println!("find {} path", i);
            let state = get_mount_state(i.as_str())?;
            println!("the {} is {}", i, if state { "mounted" } else { "unmount" });
            if state {
                continue;
            }
            mount(path, Path::new(format!("/system/app/{}", i).as_str()))?;
        }
    }
}
