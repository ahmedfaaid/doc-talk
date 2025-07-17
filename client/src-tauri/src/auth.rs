#![allow(non_snake_case)]

use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    email: String,
    password: String,
}

#[tauri::command]
pub async fn login(credentials: LoginRequest) -> Result<serde_json::Value, String> {
    let client = Client::new();

    let mut payload = HashMap::new();
    payload.insert("email", credentials.email);
    payload.insert("password", credentials.password);

    let res = client
        .post("http://localhost:5155/api/auth/login")
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(body)
}
