use anyhow::Result;

mod config;
mod defs;

fn main() -> Result<()> {
    let mut config = config::Config::new();
    loop {
        config.load_config()?;
    }
}
