#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{Manager,WebviewUrl,WebviewWindowBuilder};
#[tauri::command]
fn open_server(app:tauri::AppHandle,window:tauri::WebviewWindow,server:String,role:String)->Result<(),String>{
 if window.label()!="main"{return Err("Nativefunktioner är endast tillåtna i den lokala guiden".into())}
 let mut url=tauri::Url::parse(&server).map_err(|_|"Ogiltig serveradress")?;
 if url.scheme()!="https"||url.host_str().is_none()||!url.username().is_empty()||url.password().is_some()||url.query().is_some()||url.fragment().is_some(){return Err("Använd betrodd HTTPS utan inloggningsuppgifter i adressen".into())}
 let path=match role.as_str(){"control"=>"/control","3d"=>"/", "list"=>"/", "tv"=>"/", "home"=>"/","last"=>"/",_=>return Err("Ogiltig roll".into())};url.set_path(path);url.set_query(match role.as_str(){"3d"=>Some("view=3d"),"list"=>Some("view=list"),"tv"=>Some("profile=tv"),"last"=>Some("native=last"),_=>Some("native=home")});
 let label=format!("display-{}",std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
 WebviewWindowBuilder::new(&app,label,WebviewUrl::External(url)).title("Hemstyrning").inner_size(1440.0,960.0).build().map_err(|e|e.to_string())?;
 Ok(())
}
fn main(){tauri::Builder::default().invoke_handler(tauri::generate_handler![open_server]).run(tauri::generate_context!()).expect("Hemstyrning kunde inte startas");}
