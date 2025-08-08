use std::{collections::HashSet, fs, path::Path};

use anyhow::Result;
use serde::Deserialize;

use crate::defs::CONFIG_PATH;

#[derive(Debug, Deserialize)]
pub struct Config {
    app: HashSet<String>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            app: HashSet::new(),
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
}
