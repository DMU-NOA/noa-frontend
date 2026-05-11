import os

def create_frontend():
    print("🚀 프론트엔드 빈 폴더/파일 구조 세팅 시작...\n")

    # 생성할 폴더 목록
    folders = [
        "public",
        "src/api",
        "src/assets",
        "src/components",
        "src/pages",
        "src/utils"
    ]

    # 생성할 빈 파일 목록
    files = [
        "package.json",
        "vite.config.js",
        ".env",
        "src/main.jsx",
        "src/App.jsx",
        "src/api/client.js"
    ]

    # 폴더 생성
    for folder in folders:
        os.makedirs(folder, exist_ok=True)

    # 빈 파일 생성
    for file in files:
        with open(file, "w", encoding="utf-8") as f:
            pass # 코드를 넣지 않고 빈 파일로 생성
        print(f"✅ 생성 완료: {file}")

    print("\n🎉 프론트엔드 구조 세팅 완료!")

if __name__ == "__main__":
    create_frontend()