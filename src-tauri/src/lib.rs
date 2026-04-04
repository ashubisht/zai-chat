mod crypto;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      save_api_key,
      get_api_key,
      delete_api_key,
      save_conversation,
      get_conversations,
      delete_conversation,
      clear_all_conversations,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
