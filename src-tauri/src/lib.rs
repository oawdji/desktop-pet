use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_always_on_top(true).ok();

            // 控制面板窗口（独立于模型窗口）
            if app.get_webview_window("control").is_none() {
                tauri::WebviewWindowBuilder::new(
                    app,
                    "control",
                    tauri::WebviewUrl::App("control.html".into()),
                )
                .title("控制面板")
                .inner_size(320.0, 560.0)
                .resizable(false)
                .decorations(true)
                .transparent(false)
                .build()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
