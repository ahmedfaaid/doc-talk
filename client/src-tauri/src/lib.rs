use reqwest::Client;
use std::process::Command;
use tauri::Manager;

#[tauri::command]
async fn index_directory(path: String) -> Result<String, String> {
    let client = Client::new();
    let res = client
        .post("http://localhost:5155/index-directory")
        .json(&serde_json::json!({ "directoryPath": path }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn retrieve_indexed_directory() -> Result<String, String> {
    let client = Client::new();
    let res = client.get("http://localhost:5155/retrieve-directory").json(&serde_json::json!({})).send().await.map_err(|e| e.to_string())?;
    let body = res.json().await.map_err(|e| e.to_string())?;
  Ok(body)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let _window = app.get_webview_window("main").unwrap();
                // window.open_devtools();
            }

            std::thread::spawn(move || {
                Command::new("npm")
                    .arg("run")
                    .arg("server")
                    .output()
                    .expect("Failed to start the Node server");
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![index_directory, retrieve_indexed_directory])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("There was an error while starting the Doc-Talk Tauri app");
}
