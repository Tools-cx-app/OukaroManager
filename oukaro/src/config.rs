use std::{collections::HashSet, fs, io::Write, path::Path};

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::defs::CONFIG_PATH;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    app: App,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct App {
    pub system_app: HashSet<String>,
    pub priv_app: HashSet<String>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            app: App {
                system_app: HashSet::new(),
                priv_app: HashSet::new(),
            },
        }
    }

    /// load config
    pub fn load_config(&mut self) -> Result<()> {
        let config = Path::new(CONFIG_PATH);
        let buf = fs::read_to_string(config)?;
        if !config.exists() {
            let toml = toml::to_string(&self.app).unwrap();
            let mut file = fs::File::create(config)?;
            file.write_all(toml.as_bytes())?;
        }
        let toml: Self = toml::from_str(buf.as_str())?;
        self.app = toml.app;
        log::info!("loaded config file");
        Ok(())
    }

    /// gef app config in local config
    pub fn get(&self) -> App {
        self.app.clone()
    }
}
