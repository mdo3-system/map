import os
import sys
import webbrowser
import threading
import time
import uvicorn

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://localhost:8088")

if __name__ == "__main__":
    print("==================================================")
    print(" 案内図作成システム (アクセスマップ自動生成)")
    print(" 国土地理院ベクトルタイル × OSMハイブリッド")
    print("==================================================")
    print("サーバー起動中: http://localhost:8088")
    print("ブラウザが自動的に開きます...")
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    # backend.main:app を起動
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8088, reload=False)
