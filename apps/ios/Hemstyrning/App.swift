import SwiftUI
import WebKit
@main struct HemstyrningApp: App { var body: some Scene { WindowGroup { Launcher() } } }
struct Launcher: View {
 @AppStorage("server") var server=""
 @AppStorage("role") var role="Hem"
 @State var open=false
 @State var error=""
 let roles=["Hem","3D","Lista","Kontrollpanel","TV","Senaste"]
 var body: some View { NavigationStack { if open, let url=URL(string:server) { ServerView(origin:url,role:role).toolbar { Button("Appinställningar") { open=false } } } else { Form { Section("Välkommen till Hemstyrning") { Text("Anslut till din centrala HTTPS-server. TLS-validering och inloggning hanteras av systemet och servern.")
 TextField("https://hemstyrning.example",text:$server).textInputAutocapitalization(.never).keyboardType(.URL).autocorrectionDisabled()
 Picker("Startvy",selection:$role){ ForEach(roles,id:\.self){Text($0)} }
 Button("Anslut") { guard let u=URL(string:server),u.scheme=="https",u.host != nil,u.user==nil,u.password==nil,u.query==nil,u.fragment==nil else {error="Ange en giltig HTTPS-server";return};open=true }
 Text(error).foregroundStyle(.red)
 } }.navigationTitle("Hemstyrning 2.0") } } }
}
struct ServerView: UIViewRepresentable {
 let origin:URL;let role:String
 func makeUIView(context:Context)->WKWebView { let config=WKWebViewConfiguration();config.websiteDataStore = .default();let web=WKWebView(frame:.zero,configuration:config);web.navigationDelegate=context.coordinator;web.scrollView.contentInsetAdjustmentBehavior = .automatic;web.isOpaque=false;let path=role=="3D" ? "/?view=3d" : role=="Lista" ? "/?view=list" : role=="Kontrollpanel" ? "/control" : role=="TV" ? "/?profile=tv" : role=="Senaste" ? "/?native=last" : "/?native=home";web.load(URLRequest(url:URL(string:path,relativeTo:origin)!));return web }
 func updateUIView(_ view:WKWebView,context:Context){}
 func makeCoordinator()->Coordinator { Coordinator(origin:origin) }
 class Coordinator:NSObject,WKNavigationDelegate { let origin:URL;init(origin:URL){self.origin=origin}
 func webView(_ webView:WKWebView,decidePolicyFor action:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let u=action.request.url else{decisionHandler(.cancel);return};decisionHandler(u.scheme=="https"&&u.host?.lowercased()==origin.host?.lowercased()&&(u.port ?? 443)==(origin.port ?? 443) ? .allow : .cancel)}
 func webView(_ webView:WKWebView,didFinish navigation:WKNavigation!){if let u=webView.url,!u.path.hasPrefix("/auth"){UserDefaults.standard.set(u.path+(u.query.map{"?"+$0} ?? ""),forKey:"last")}}
 // Default URLSession/WKWebView trust evaluation is retained; no insecure challenge override.
 }
}
