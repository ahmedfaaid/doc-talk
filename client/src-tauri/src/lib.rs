mod auth;
use futures::stream::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatResponse {
    id: u8,
    event: String,
    data: String,
}

#[tauri::command]
async fn index_directory(
    directory_path: String,
    name: String,
) -> Result<serde_json::Value, String> {
    let client = Client::new();
    let res = client
        .post("http://localhost:5155/index-directory")
        .json(&serde_json::json!({
            "directoryPath": directory_path,
            "name": name,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn retrieve_indexed_directory(
    directory: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = Client::new();
    let mut request = client.get("http://localhost:5155/retrieve-directory");

    if let Some(dir) = directory {
        request = request.query(&[("directory", &dir)]);
    }

    let res = request.send().await.map_err(|e| e.to_string())?;
    let body = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn chat(window: tauri::Window, query: String, directory_path: String) -> Result<(), String> {
    let client = Client::new();

    let res = client
        .post("http://localhost:5155/chat")
        .json(&serde_json::json!({
            "query": query,
            "directoryPath": directory_path,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                    if let Ok(chat_response) = serde_json::from_str::<ChatResponse>(&text) {
                        window
                            .emit("chat-response", chat_response)
                            .map_err(|e| e.to_string())?;
                    }
                }
            }
            Err(e) => {
                return Err(format!("Error reading stream: {}", e));
            }
        }
    }

    Ok(())
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
        .invoke_handler(tauri::generate_handler![
            index_directory,
            retrieve_indexed_directory,
            chat,
            auth::login
        ])
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("There was an error while starting the Doc-Talk Tauri app");
}
