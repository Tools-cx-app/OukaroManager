use std::{collections::HashSet, fs, path::Path};

use anyhow::Result;
use serde::Deserialize;

use crate::defs::CONFIG_PATH;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    app: App,
}

#[derive(Debug, Clone, Deserialize)]
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

    pub fn load_config(&mut self) -> Result<()> {
        let config = Path::new(CONFIG_PATH);
        let buf = fs::read_to_string(config)?;
        let toml: Self = toml::from_str(buf.as_str())?;
        self.app = toml.app;
        Ok(())
    }

    pub fn contains(&self, v: &str) -> bool {
        self.app.contains(v)
    }

    pub fn get(&self) -> App {
        self.app.clone()
    }
}
